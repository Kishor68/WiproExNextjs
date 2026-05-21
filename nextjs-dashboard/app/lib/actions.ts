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
    image?: string[];
  };
  message?: string | null;
};

const CustomerSchema = z.object({
  name: z.string().min(1, { message: 'Please enter a name.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export async function createCustomer(
  prevState: CustomerState,
  formData: FormData,
): Promise<CustomerState> {
  const validatedFields = CustomerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Customer.',
    };
  }

  const { name, email } = validatedFields.data;
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
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${name}, ${email}, ${imageUrl})
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