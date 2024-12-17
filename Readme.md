# Next.js Form Generator CLI

A powerful CLI tool that generates customizable form components for Next.js applications with built-in features like server actions, API routes, Zod validation, and MongoDB integration.

## Features

- 🎨 Multiple form styles (Default, Card, Inline)
- 🔄 Server Actions support for App Router
- 🛣️ API Routes for Pages Router
- ✨ TypeScript support
- 🎯 Zod validation schema generation
- 💾 MongoDB integration
- 🎨 Custom color theming
- 📱 Responsive design
- ⚡ Loading states
- ❌ Error handling
- 🔗 Optional link integration
- 🎨 Custom styling and alignment options

## Installation

```bash
# Clone the repository
git clone nextjs-shadcn-zod-form-generator-cli-based
cd nextjs-shadcn-zod-form-generator-cli-based

# Install dependencies
npm install

# Run
node index.js
```

### Configuration Options

1. **Basic Form Settings**
   - Form name
   - Number of input fields
   - Number of buttons
   - Submit button selection

2. **Input Field Configuration**
   - Field name
   - Label
   - Placeholder
   - Input type (text, email, password, number, date, tel, url, textarea)
   - Validation rules
   - Custom error messages

3. **Button Configuration**
   - Button name
   - Variant (default, destructive, outline, secondary, ghost, link)

4. **Layout Options**
   - Form style (Default, Card, Inline)
   - Horizontal alignment (Left, Center, Right)
   - Vertical alignment (Top, Center, Bottom)
   - Custom form width
   - Custom colors

5. **Advanced Features**
   - Router type (App Router / Pages Router)
   - Server Actions support
   - API route generation
   - TypeScript integration
   - MongoDB database integration
   - Loading states
   - Error handling
   - Success/Error messages

### Generated Files

The tool generates the following files in the `generated-form` directory:

```
generated-form/
├── [routerType]/
│   ├── YourForm.tsx
│   └── YourFormAction.ts (if using Server Actions)
├── api/
│   └── YourForm.ts (or route.ts for App Router)
├── lib/
│   └── mongodb.ts (if using MongoDB)
├── YourFormSchema.ts
└── YourFormConfig.json
```

### Example Usage

```bash
$ node index.js

? What is the name of your form? ContactForm
? How many input fields do you want in your form? 3
? How many buttons do you want in your form? 2
? Which button should be the submit button? 1
...
```

### Required Dependencies

After generating the form, install the required dependencies:

```bash
npm install react-hook-form @hookform/resolvers zod
npx shadcn@latest init
npx shadcn@latest add form input button
```

For MongoDB integration:
```bash
npm install mongodb
```

### Environment Variables

If using MongoDB, add to your `.env` file:
```
MONGODB_URI=your_mongodb_connection_string_here
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.