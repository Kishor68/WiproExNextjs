'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { Resend } from 'resend';
import { randomBytes, randomUUID } from 'crypto';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select a status.',
    }),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    try {
        await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
        console.error(error);
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// ...

export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData,
) {
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Invoice.',
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
    } catch (error) {
        console.error(error);
        return { message: 'Database Error: Failed to Update Invoice.' };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}
export async function deleteInvoice(id: string) {

    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
}
export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};
export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

const RegisterSchema = z.object({
  name: z.string().min(1, { message: 'Please enter your name.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export async function registerUser(
  prevState: string | undefined,
  formData: FormData,
) {
  const validatedFields = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return 'Please enter a valid name, email, and password.';
  }

  const { name, email, password } = validatedFields.data;
  const image = formData.get('image') as File | null;

  try {
    const existingUser = await sql<{ email: string }[]>`
      SELECT email FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return 'That email is already taken.';
    }

    let imageUrl = '/customers/evil-rabbit.png';

    if (image && image.size > 0) {
      try {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${image.name.replace(/\s+/g, '_')}`;
        const path = join(process.cwd(), 'public', 'customers', filename);
        await writeFile(path, buffer);
        imageUrl = `/customers/${filename}`;
      } catch (e) {
        console.error('Failed to write image to disk', e);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (name, email, password, image_url, about)
      VALUES (${name}, ${email}, ${hashedPassword}, ${imageUrl}, '')
    `;

    return 'Registration successful. Please log in with your new account.';
  } catch (error) {
    console.error(error);
    return 'Database Error: Failed to register.';
  }
}

const CreateDashboardUserSchema = z.object({
  name: z.string().min(1, { message: 'Please enter your name.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['admin', 'customer'], { invalid_type_error: 'Please select a valid role.' }),
});

export type RegisterState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    role?: string[];
    image?: string[];
  };
  message?: string | null;
};

export async function createDashboardUser(
  prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const validatedFields = CreateDashboardUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please enter a valid name, email, password, and role.',
    };
  }

  const { name, email, password, role } = validatedFields.data;
  const image = formData.get('image') as File | null;
  let imageUrl = '/customers/evil-rabbit.png';

  if (image && image.size > 0) {
    try {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${image.name.replace(/\s+/g, '_')}`;
      const path = join(process.cwd(), 'public', 'customers', filename);
      await writeFile(path, buffer);
      imageUrl = `/customers/${filename}`;
    } catch (e) {
      console.error('Failed to write image to disk', e);
    }
  }

  try {
    const existingUser = await sql<{ email: string }[]>`
      SELECT email FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return {
        message: 'That email is already taken.',
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (id, name, email, password, image_url, about, role)
      VALUES (${randomUUID()}, ${name}, ${email}, ${hashedPassword}, ${imageUrl}, '', ${role})
    `;

    return {
      message: 'User registered successfully.',
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: Failed to register user.',
    };
  }
}

export async function updateProfile(
  id: string,
  prevState: State,
  formData: FormData,
): Promise<State> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const about = formData.get('about') as string;
  const name = formData.get('name') as string;
  const image = formData.get('image') as File | null;

  if (!email || !name) {
     return {
         message: 'Missing Fields. Name and Email are required.',
     };
  }

  let imageUrl: string | undefined;

  if (image && image.size > 0) {
    try {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${image.name.replace(/\\s+/g, '_')}`;
      const path = join(process.cwd(), 'public', 'customers', filename);
      await writeFile(path, buffer);
      imageUrl = `/customers/${filename}`;
    } catch (e) {
      console.error('Failed to write image to disk', e);
    }
  }

  try {
      if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          if (imageUrl) {
            await sql`
              UPDATE users
              SET email = ${email}, password = ${hashedPassword}, about = ${about}, name = ${name}, image_url = ${imageUrl}
              WHERE id = ${id}
            `;
          } else {
            await sql`
              UPDATE users
              SET email = ${email}, password = ${hashedPassword}, about = ${about}, name = ${name}
              WHERE id = ${id}
            `;
          }
      } else {
          if (imageUrl) {
            await sql`
              UPDATE users
              SET email = ${email}, about = ${about}, name = ${name}, image_url = ${imageUrl}
              WHERE id = ${id}
            `;
          } else {
            await sql`
              UPDATE users
              SET email = ${email}, about = ${about}, name = ${name}
              WHERE id = ${id}
            `;
          }
      }
  } catch (error) {
      console.error(error);
      return { message: 'Database Error: Failed to Update Profile.' };
  }

  revalidatePath('/dashboard/profile');
  return { message: 'Profile updated successfully.' };
}

export type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    image?: string[];
  };
  message?: string | null;
};

const CustomerSchema = z.object({
  name: z.string().min(1, { message: 'Please enter a name.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export async function createCustomer(
  prevState: CustomerState,
  formData: FormData,
): Promise<CustomerState> {
  const validatedFields = CustomerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Customer.',
    };
  }

  const { name, email, password } = validatedFields.data;
  const image = formData.get('image') as File | null;
  
  let imageUrl = '/customers/evil-rabbit.png'; // Default image

  if (image && image.size > 0) {
    try {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${image.name.replace(/\\s+/g, '_')}`;
      const path = join(process.cwd(), 'public', 'customers', filename);
      await writeFile(path, buffer);
      imageUrl = `/customers/${filename}`;
    } catch (e) {
      console.error('Failed to write image to disk', e);
    }
  }

  try {
    const existingCustomer = await sql<{ email: string }[]>`
      SELECT email FROM customers WHERE email = ${email}
    `;

    const existingUser = await sql<{ email: string }[]>`
      SELECT email FROM users WHERE email = ${email}
    `;

    if (existingCustomer.length > 0 || existingUser.length > 0) {
      return {
        message: 'A customer or user with that email already exists.',
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${name}, ${email}, ${imageUrl})
    `;

    await sql`
      INSERT INTO users (id, name, email, password, image_url, about, role)
      VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, ${imageUrl}, '', 'customer')
    `;
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: Failed to Create Customer.',
    };
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

// Password Reset Functions
export async function requestPasswordReset(
  prevState: string | undefined,
  formData: FormData,
): Promise<string> {
  const email = formData.get('email') as string;

  if (!email) {
    return 'Please enter your email address.';
  }

  try {
    const user = await sql<{ id: string; email: string }[]>`
      SELECT id, email FROM users WHERE email = ${email}
    `;

    if (user.length === 0) {
      // Don't reveal if email exists or not for security
      return 'If an account exists with this email, you will receive a password reset link.';
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    const tokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store OTP in database
    await sql`
      UPDATE users
      SET password_reset_token = ${otp}, password_reset_token_expiry = ${tokenExpiry}
      WHERE email = ${email}
    `;

    // Send email with OTP (instantiate Resend lazily)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not set; skipping sending OTP email.');
    } else {
      const resendClient = new Resend(resendApiKey);
      await resendClient.emails.send({
        from: 'noreply@acme.com',
        to: email,
        subject: 'Your Password Reset OTP',
        html: `
          <h2>Password Reset Request</h2>
          <p>Your OTP is: <strong>${otp}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    }

    return 'If an account exists with this email, you will receive a password reset link.';
  } catch (error) {
    console.error('Password reset error:', error);
    return 'An error occurred. Please try again later.';
  }
}

export async function verifyOTP(
  prevState: string | undefined,
  formData: FormData,
): Promise<string> {
  const email = formData.get('email') as string;
  const otp = formData.get('otp') as string;

  if (!email || !otp) {
    return 'Please enter your email and OTP.';
  }

  try {
    const user = await sql<
      { id: string; password_reset_token: string; password_reset_token_expiry: number }[]
    >`
      SELECT id, password_reset_token, password_reset_token_expiry FROM users WHERE email = ${email}
    `;

    if (user.length === 0) {
      return 'User not found.';
    }

    const [userData] = user;

    // Check if OTP is valid and not expired
    if (userData.password_reset_token !== otp) {
      return 'Invalid OTP.';
    }

    if (userData.password_reset_token_expiry < Date.now()) {
      return 'OTP has expired. Please request a new one.';
    }

    // OTP is valid
    return 'OTP verified successfully.';
  } catch (error) {
    console.error('OTP verification error:', error);
    return 'An error occurred. Please try again.';
  }
}

export async function resetPassword(
  prevState: string | undefined,
  formData: FormData,
): Promise<string> {
  const email = formData.get('email') as string;
  const otp = formData.get('otp') as string;
  const newPassword = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !otp || !newPassword || !confirmPassword) {
    return 'Please fill in all fields.';
  }

  if (newPassword !== confirmPassword) {
    return 'Passwords do not match.';
  }

  if (newPassword.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  try {
    const user = await sql<
      { id: string; password_reset_token: string; password_reset_token_expiry: number }[]
    >`
      SELECT id, password_reset_token, password_reset_token_expiry FROM users WHERE email = ${email}
    `;

    if (user.length === 0) {
      return 'User not found.';
    }

    const [userData] = user;

    // Verify OTP again
    if (userData.password_reset_token !== otp) {
      return 'Invalid OTP.';
    }

    if (userData.password_reset_token_expiry < Date.now()) {
      return 'OTP has expired. Please request a new one.';
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await sql`
      UPDATE users
      SET password = ${hashedPassword}, password_reset_token = NULL, password_reset_token_expiry = NULL
      WHERE id = ${userData.id}
    `;

    return 'Password reset successfully. You can now log in with your new password.';
  } catch (error) {
    console.error('Password reset error:', error);
    return 'An error occurred. Please try again.';
  }
}

// Admin user management actions
const UpdateUserRoleSchema = z.object({ id: z.string(), role: z.enum(['admin', 'customer']) });

export async function updateUserRole(
  prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const validated = UpdateUserRoleSchema.safeParse({ id: formData.get('id'), role: formData.get('role') });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Invalid input.' };
  }

  const { id, role } = validated.data;

  try {
    await sql`
      UPDATE users SET role = ${role} WHERE id = ${id}
    `;
    revalidatePath('/dashboard/users');
    return { message: 'User role updated.' };
  } catch (err) {
    console.error(err);
    return { message: 'Database Error: Failed to update user role.' };
  }
}

const DeleteUserSchema = z.object({ id: z.string() });

export async function deleteUser(prevState: string | undefined, formData: FormData): Promise<string> {
  const validated = DeleteUserSchema.safeParse({ id: formData.get('id') });
  if (!validated.success) return 'Invalid user id.';

  try {
    await sql`
      DELETE FROM users WHERE id = ${validated.data.id}
    `;
    revalidatePath('/dashboard/users');
    return 'User deleted.';
  } catch (err) {
    console.error(err);
    return 'Database Error: Failed to delete user.';
  }
}
