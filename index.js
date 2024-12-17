#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateFormComponent, generateServerAction, generateApiRoute, generateZodSchema, generateMongoDbFile } from './generators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateFormFiles(answers) {
  try {
    const formComponentContent = generateFormComponent(answers);
    const serverActionContent = answers.useServerActions ? generateServerAction(answers) : null;
    const apiRouteContent = answers.createApiRoute ? generateApiRoute(answers) : null;
    const zodSchemaContent = generateZodSchema(answers);
    const mongoDbContent = answers.includeDatabase ? generateMongoDbFile() : null;

    const outputDir = path.join(process.cwd(), 'generated-form');
    
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(path.join(outputDir, answers.routerType), { recursive: true });
    
    if (answers.useServerActions) {
      await fs.writeFile(path.join(outputDir, answers.routerType, `${answers.formName}Action.ts`), serverActionContent);
    }
    
    if (answers.createApiRoute) {
      if (answers.routerType === 'app') {
        await fs.mkdir(path.join(outputDir, 'app', 'api', answers.formName), { recursive: true });
        await fs.writeFile(path.join(outputDir, 'app', 'api', answers.formName, 'route.ts'), apiRouteContent);
      } else {
        await fs.mkdir(path.join(outputDir, 'pages', 'api'), { recursive: true });
        await fs.writeFile(path.join(outputDir, 'pages', 'api', `${answers.formName}.ts`), apiRouteContent);
      }
    }
    
    await fs.writeFile(path.join(outputDir, answers.routerType, `${answers.formName}.tsx`), formComponentContent);
    await fs.writeFile(path.join(outputDir, `${answers.formName}Schema.ts`), zodSchemaContent);

    if (answers.includeDatabase) {
      await fs.mkdir(path.join(outputDir, 'lib'), { recursive: true });
      await fs.writeFile(path.join(outputDir, 'lib', 'mongodb.ts'), mongoDbContent);
    }

    // Save answers to JSON file
    await fs.writeFile(path.join(outputDir, `${answers.formName}Config.json`), JSON.stringify(answers, null, 2));

    console.log('Form files generated successfully!');
    
    const installCommands = generateInstallCommands(answers);
    console.log('\nTo set up your project, run the following commands:');
    console.log(installCommands);

    if (answers.includeDatabase) {
      console.log('\nDon\'t forget to add your MongoDB connection string to your .env file:');
      console.log('MONGODB_URI=your_mongodb_connection_string_here');
    }
  } catch (error) {
    console.error('Error generating form files:', error);
  }
}

function generateInstallCommands(answers) {
  const { useTypeScript, formStyle, includeDatabase } = answers;
  
  let commands = `
npm install react-hook-form @hookform/resolvers zod
npx shadcn@latest init
npx shadcn@latest add form input button
`;

  if (formStyle === 'Card') {
    commands += 'npx shadcn@latest add card\n';
  }

  if (includeDatabase) {
    commands += 'npm install mongodb\n';
  }

  return commands.trim();
}

async function main() {
  try {
    const useExistingConfig = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'loadConfig',
        message: 'Do you want to load a previously saved form configuration?',
        default: false,
      },
    ]);

    let answers = {};

    if (useExistingConfig.loadConfig) {
      const configFile = await inquirer.prompt([
        {
          type: 'input',
          name: 'configPath',
          message: 'Enter the path to the configuration JSON file:',
          validate: async (input) => {
            try {
              await fs.access(input);
              return true;
            } catch (error) {
              return 'File does not exist or is not accessible';
            }
          },
        },
      ]);

      const configContent = await fs.readFile(configFile.configPath, 'utf-8');
      answers = JSON.parse(configContent);
    } else {
      const basicInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'formName',
          message: 'What is the name of your form?',
          validate: input => input.trim() !== '' || 'Form name cannot be empty',
        },
        {
          type: 'number',
          name: 'inputCount',
          message: 'How many input fields do you want in your form?',
          validate: value => value > 0 || 'Please enter a number greater than 0',
        },
        {
          type: 'number',
          name: 'buttonCount',
          message: 'How many buttons do you want in your form?',
          validate: value => value > 0 || 'Please enter a number greater than 0',
        },
      ]);

      const submitButtonQuestion = await inquirer.prompt([
        {
          type: 'number',
          name: 'submitButtonIndex',
          message: 'Which button should be the submit button? (Enter the index, starting from 1)',
          validate: (value) => {
            const index = parseInt(value);
            return (index > 0 && index <= basicInfo.buttonCount) || 'Please enter a valid button index';
          },
        },
      ]);

      const additionalInfo = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addLink',
          message: 'Do you want to add a link to another page?',
        },
        {
          type: 'input',
          name: 'linkText',
          message: 'Enter the text for the link:',
          when: answers => answers.addLink,
          validate: input => input.trim() !== '' || 'Link text cannot be empty',
        },
        {
          type: 'input',
          name: 'linkHref',
          message: 'Enter the href for the link:',
          when: answers => answers.addLink,
          validate: input => input.trim() !== '' || 'Link href cannot be empty',
        },
        {
          type: 'list',
          name: 'routerType',
          message: 'Which router do you want to use?',
          choices: ['app', 'pages'],
          default: 'app',
        },
        {
          type: 'confirm',
          name: 'useServerActions',
          message: 'Do you want to use Server Actions?',
          when: answers => answers.routerType === 'app',
          default: true,
        },
        {
          type: 'confirm',
          name: 'createApiRoute',
          message: 'Do you want to create an API route for this form?',
          when: answers => answers.routerType === 'pages' || !answers.useServerActions,
          default: true,
        },
        {
          type: 'confirm',
          name: 'useTypeScript',
          message: 'Do you want to use TypeScript?',
          default: true,
        },
        {
          type: 'list',
          name: 'formStyle',
          message: 'Choose a form style:',
          choices: ['Default', 'Card', 'Inline'],
          default: 'Default',
        },
        {
          type: 'list',
          name: 'horizontalAlignment',
          message: 'Choose the horizontal alignment for your form:',
          choices: ['Left', 'Center', 'Right'],
          default: 'Center',
        },
        {
          type: 'list',
          name: 'verticalAlignment',
          message: 'Choose the vertical alignment for your form:',
          choices: ['Top', 'Center', 'Bottom'],
          default: 'Center',
        },
        {
          type: 'input',
          name: 'formWidth',
          message: 'Enter the responsive width for your form (e.g., "w-full max-w-md"):',
          default: 'w-full max-w-md',
        },
        {
          type: 'confirm',
          name: 'useCustomColors',
          message: 'Do you want to use custom colors?',
          default: false,
        },
        {
          type: 'input',
          name: 'primaryColor',
          message: 'Enter the primary color (hex code, e.g., #000000):',
          when: answers => answers.useCustomColors,
          validate: input => /^#[0-9A-Fa-f]{6}$/.test(input) || 'Please enter a valid hex color code',
        },
        {
          type: 'input',
          name: 'secondaryColor',
          message: 'Enter the secondary color (hex code, e.g., #000000):',
          when: answers => answers.useCustomColors,
          validate: input => /^#[0-9A-Fa-f]{6}$/.test(input) || 'Please enter a valid hex color code',
        },
        {
          type: 'confirm',
          name: 'addLoadingState',
          message: 'Do you want to add a loading state to the form?',
          default: true,
        },
        {
          type: 'confirm',
          name: 'addErrorHandling',
          message: 'Do you want to add error handling to the form?',
          default: true,
        },
        {
          type: 'input',
          name: 'successMessage',
          message: 'Enter the success message for the form:',
          default: 'Form submitted successfully!',
        },
        {
          type: 'input',
          name: 'errorMessage',
          message: 'Enter the error message for the form:',
          default: 'An error occurred while submitting the form. Please try again.',
        },
        {
          type: 'confirm',
          name: 'includeDatabase',
          message: 'Do you want to include MongoDB database integration?',
          default: false,
        },
        {
          type: 'input',
          name: 'databaseName',
          message: 'Enter the name of the database:',
          when: answers => answers.includeDatabase,
          validate: input => input.trim() !== '' || 'Database name cannot be empty',
        },
        {
          type: 'input',
          name: 'collectionName',
          message: 'Enter the name of the collection:',
          when: answers => answers.includeDatabase,
          validate: input => input.trim() !== '' || 'Collection name cannot be empty',
        },
      ]);

      answers = { ...basicInfo, ...submitButtonQuestion, ...additionalInfo };

      // Additional prompts for each input field
      const inputFields = [];
      for (let i = 0; i < answers.inputCount; i++) {
        const fieldAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: `Name for input field ${i + 1}:`,
            validate: input => input.trim() !== '' || 'Field name cannot be empty',
          },
          {
            type: 'input',
            name: 'label',
            message: `Label for input field ${i + 1}:`,
            validate: input => input.trim() !== '' || 'Field label cannot be empty',
          },
          {
            type: 'input',
            name: 'placeholder',
            message: `Placeholder for input field ${i + 1}:`,
          },
          {
            type: 'list',
            name: 'type',
            message: `Type for input field ${i + 1}:`,
            choices: ['text', 'email', 'password', 'number', 'date', 'tel', 'url', 'textarea'],
          },
          {
            type: 'input',
            name: 'validation',
            message: `Validation rules for input field ${i + 1} (e.g., "required,min:3,max:50"):`,
          },
          {
            type: 'input',
            name: 'errorMessage',
            message: `Custom error message for input field ${i + 1} (leave blank for default):`,
          },
        ]);
        inputFields.push(fieldAnswers);
      }

      // Additional prompts for each button
      const buttons = [];
      for (let i = 0; i < answers.buttonCount; i++) {
        const buttonAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: `Name for button ${i + 1}:`,
            validate: input => input.trim() !== '' || 'Button name cannot be empty',
          },
          {
            type: 'list',
            name: 'variant',
            message: `Choose a variant for button ${i + 1}:`,
            choices: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
            default: 'default',
          },
        ]);
        buttons.push(buttonAnswers);
      }

      answers.inputFields = inputFields;
      answers.buttons = buttons;
    }

    await generateFormFiles(answers);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main().catch(console.error);

