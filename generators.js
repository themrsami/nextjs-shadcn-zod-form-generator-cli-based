export function generateFormComponent(answers) {
  const { formName, inputFields, buttons, submitButtonIndex, addLink, linkText, linkHref, useTypeScript, formStyle, horizontalAlignment, verticalAlignment, formWidth, addLoadingState, addErrorHandling, includeDatabase, useServerActions, routerType, useCustomColors, primaryColor, secondaryColor, successMessage, errorMessage } = answers;

  let imports = `
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
${formStyle === 'Card' ? "import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from \"@/components/ui/card\";" : ''}
import { ${formName}Schema } from './${formName}Schema';
${useServerActions ? `import { ${formName}Action } from './${formName}Action';` : ''}
  `.trim();

  let formFields = inputFields.map((field, index) => `
  <FormField
    control={form.control}
    name="${field.name}"
    render={({ field }) => (
      <FormItem>
        <FormLabel>${field.label}</FormLabel>
        <FormControl>
          ${field.type === 'textarea' 
            ? `<Textarea placeholder="${field.placeholder}" {...field} />`
            : `<Input type="${field.type}" placeholder="${field.placeholder}" {...field} />`
          }
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  `).join('\n');

  let buttonElements = buttons.map((button, index) => `
  <Button 
    type="${index + 1 === parseInt(submitButtonIndex) ? 'submit' : 'button'}" 
    variant="${button.variant}"
    ${addLoadingState && index + 1 === parseInt(submitButtonIndex) ? 'disabled={isSubmitting}' : ''}
  >
    ${addLoadingState && index + 1 === parseInt(submitButtonIndex) ? '{isSubmitting ? "Submitting..." : "' + button.name + '"}' : button.name}
  </Button>
  `).join('\n');

  let linkElement = addLink ? `
  <Link href="${linkHref}" className="text-sm text-blue-600 hover:underline">${linkText}</Link>
  ` : '';

  let formContent = '';
  if (formStyle === 'Card') {
    formContent = `
      <Card>
        <CardHeader>
          <CardTitle>${formName}</CardTitle>
          <CardDescription>Please fill out the form below</CardDescription>
        </CardHeader>
        <CardContent>
          ${formFields}
        </CardContent>
        <CardFooter className="flex justify-between">
          ${buttonElements}
          ${linkElement}
        </CardFooter>
      </Card>
    `;
  } else if (formStyle === 'Inline') {
    formContent = `
      <div className="flex items-center space-x-4>
        ${formFields}
        ${buttonElements}
        ${linkElement}
      </div>
    `;
  } else {
    formContent = `
      <div className="space-y-8">
        ${formFields}
        <div className="flex justify-between items-center">
          ${buttonElements}
          ${linkElement}
        </div>
      </div>
    `;
  }

  let horizontalAlignmentClass = '';
  switch (horizontalAlignment) {
    case 'Left':
      horizontalAlignmentClass = 'items-start';
      break;
    case 'Center':
      horizontalAlignmentClass = 'mx-auto';
      break;
    case 'Right':
      horizontalAlignmentClass = 'items-end';
      break;
  }

  let verticalAlignmentClass = '';
  switch (verticalAlignment) {
    case 'Top':
      verticalAlignmentClass = 'justify-start';
      break;
    case 'Center':
      verticalAlignmentClass = 'justify-center';
      break;
    case 'Bottom':
      verticalAlignmentClass = 'justify-end';
      break;
  }

  let customColorStyles = '';
  if (useCustomColors) {
    customColorStyles = `
  :root {
    --primary-color: ${primaryColor};
    --secondary-color: ${secondaryColor};
  }
  `;
  }

  let componentContent = `
${imports}

${customColorStyles}

export default function ${formName}Form() {
  ${addLoadingState ? 'const [isSubmitting, setIsSubmitting] = useState(false);' : ''}
  ${addErrorHandling ? 'const [error, setError] = useState("");' : ''}
  const [successMessage, setSuccessMessage] = useState("");
  const form = useForm<z.infer<typeof ${formName}Schema>>({
    resolver: zodResolver(${formName}Schema),
    defaultValues: {
      ${inputFields.map(field => `${field.name}: ""`).join(',\n      ')}
    },
  });

  const onSubmit = async (data: z.infer<typeof ${formName}Schema>) => {
    ${addLoadingState ? 'setIsSubmitting(true);' : ''}
    ${addErrorHandling ? 'setError("");' : ''}
    setSuccessMessage("");
    try {
      ${useServerActions ? `
      const result = await ${formName}Action(data);
      if (result.success) {
        setSuccessMessage("${successMessage}");
        form.reset();
      } else {
        throw new Error(result.error || '${errorMessage}');
      }
      ` : `
      ${includeDatabase ? `
      const response = await fetch('/api/${formName}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        setSuccessMessage("${successMessage}");
        form.reset();
      } else {
        throw new Error(result.error || '${errorMessage}');
      }
      ` : `
      // Handle form submission
      console.log(data);
      // You can add your API call here
      setSuccessMessage("${successMessage}");
      form.reset();
      `}
      `}
    } catch (error) {
      console.error('Form submission error:', error);
      ${addErrorHandling ? 'setError((error instanceof Error ? error.message : "' + errorMessage + '"));' : ''}
    } ${addLoadingState ? 'finally {\n      setIsSubmitting(false);\n    }' : ''}
  };

  return (
    <div className="flex flex-col ${horizontalAlignmentClass} ${verticalAlignmentClass} min-h-screen ${formWidth}">
      <h1 className="text-2xl font-bold mb-4">${formName}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          ${formContent}
        </form>
      </Form>
      ${addErrorHandling ? '{error && <p className="text-red-500 mt-4">{error}</p>}' : ''}
      {successMessage && <p className="text-green-500 mt-4">{successMessage}</p>}
    </div>
  );
}
  `.trim();

  return componentContent;
}

export function generateServerAction(answers) {
  const { formName, includeDatabase, databaseName, collectionName } = answers;

  let actionContent = `
'use server'

import { ${formName}Schema } from './${formName}Schema';
${includeDatabase ? "import clientPromise from '@/lib/mongodb';" : ''}

export async function ${formName}Action(data) {
  try {
    const validatedData = ${formName}Schema.parse(data);
    
    ${includeDatabase ? `
    const client = await clientPromise;
    const db = client.db("${databaseName}");
    const collection = db.collection("${collectionName}");
    
    await collection.insertOne(validatedData);
    ` : '// Process the validated data\n    // For example, save to database, send email, etc.'}
    
    return { success: true, data: validatedData };
  } catch (error) {
    console.error('Server Action error:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}
  `.trim();

  return actionContent;
}

export function generateApiRoute(answers) {
  const { formName, routerType, includeDatabase, databaseName, collectionName } = answers;

  let imports = `
${routerType === 'app' ? "import { NextResponse } from 'next/server';" : "import { NextApiRequest, NextApiResponse } from 'next';"}
import { ${formName}Schema } from '${routerType === 'app' ? '../..' : '..'}/${formName}Schema';
${includeDatabase ? "import clientPromise from '@/lib/mongodb';" : ''}
  `.trim();

  let routeContent = '';
  if (routerType === 'app') {
    routeContent = `
export async function POST(req) {
  try {
    const body = await req.json();
    const data = ${formName}Schema.parse(body);
    
    ${includeDatabase ? `
    const client = await clientPromise;
    const db = client.db("${databaseName}");
    const collection = db.collection("${collectionName}");
    
    await collection.insertOne(data);
    ` : '// Process the validated data\n    // For example, save to database, send email, etc.'}
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ success: false, error: error.message || 'An error occurred' }, { status: 400 });
  }
}
    `.trim();
  } else {
    routeContent = `
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const data = ${formName}Schema.parse(req.body);
      
      ${includeDatabase ? `
      const client = await clientPromise;
      const db = client.db("${databaseName}");
      const collection = db.collection("${collectionName}");
      
      await collection.insertOne(data);
      ` : '// Process the validated data\n      // For example, save to database, send email, etc.'}
      
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('API route error:', error);
      res.status(400).json({ success: false, error: error.message || 'An error occurred' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(\`Method \${req.method} Not Allowed\`);
  }
}
    `.trim();
  }

  return `${imports}\n\n${routeContent}`;
}

export function generateZodSchema(answers) {
  const { formName, inputFields } = answers;

  let schemaContent = `
import { z } from 'zod';

export const ${formName}Schema = z.object({
  ${inputFields.map(field => {
    let validation = 'z.string()';
    if (field.validation) {
      const rules = field.validation.split(',');
      rules.forEach(rule => {
        const [name, value] = rule.split(':');
        switch (name.trim()) {
          case 'required':
            validation += `.nonempty("${field.errorMessage || 'This field is required'}")`;
            break;
          case 'min':
            validation += `.min(${value}, "${field.errorMessage || `Minimum ${value} characters required`}")`;
            break;
          case 'max':
            validation += `.max(${value}, "${field.errorMessage || `Maximum ${value} characters allowed`}")`;
            break;
          case 'email':
            validation += `.email("${field.errorMessage || 'Invalid email address'}")`;
            break;
        }
      });
    }
    if (field.type === 'email') {
      validation += `.email("${field.errorMessage || 'Invalid email address'}")`;
    }
    if (field.type === 'number') {
      validation = `z.number().int("${field.errorMessage || 'Must be a valid integer'}")`;
    }
    return `${field.name}: ${validation},`;
  }).join('\n  ')}
});
  `.trim();

  return schemaContent;
}

export function generateMongoDbFile() {
  return `
import { MongoClient, MongoClientOptions } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options: MongoClientOptions = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
  `.trim();
}

