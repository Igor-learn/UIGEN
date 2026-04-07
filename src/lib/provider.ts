import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("pricing") || (promptLower.includes("price") && promptLower.includes("card"))) {
      componentType = "pricing";
      componentName = "PricingCard";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Send Message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;`;

      case "pricing":
        return `import React from 'react';

const PricingCard = () => {
  const features = [
    { name: '50,000 API calls/month', included: true },
    { name: 'Advanced analytics dashboard', included: true },
    { name: 'Priority email support', included: true },
    { name: 'Custom integrations', included: true },
    { name: '99.9% uptime SLA', included: true },
    { name: 'Dedicated account manager', included: false },
  ];

  return (
    <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-105 transition-transform duration-300 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>

      <div className="relative z-10">
        <div className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold mb-4">
          ✨ Most Popular
        </div>

        <h3 className="text-3xl font-bold mb-2">Professional</h3>
        <p className="text-purple-100 mb-6">For growing teams and businesses</p>

        <div className="mb-6">
          <span className="text-5xl font-bold">$79</span>
          <span className="text-purple-200 text-lg">/month</span>
        </div>

        <button className="w-full bg-white text-purple-700 font-semibold py-3 px-6 rounded-xl hover:bg-purple-50 transition-colors duration-200 mb-8 shadow-lg">
          Start Free Trial →
        </button>

        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{feature.included ? '✓' : '○'}</span>
              <span className={\`\${feature.included ? 'text-white' : 'text-purple-300'}\`}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingCard;`;

      case "card":
        return `import React from 'react';

const Card = ({
  productName = "PDF Architect PRO",
  originalPrice = 3886.46,
  discountedPrice = 1703.06,
  discountPercent = 56,
  features = ["View", "Create", "Convert", "Edit", "Page", "Secure", "Batch", "Comment", "Forms"],
  licenseType = "1-year license",
  description = "",
  buttonText = "SELECT"
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editableText, setEditableText] = React.useState({
    productName,
    description,
    buttonText,
    licenseType,
    customNote: ""
  });

  // FIX: Critical - Sync state when props change
  React.useEffect(() => {
    setEditableText({
      productName,
      description,
      buttonText,
      licenseType,
      customNote: ""
    });
  }, [productName, description, buttonText, licenseType]);

  // FIX: High - Sanitize and validate input
  const handleTextChange = (field, value) => {
    if (typeof value !== 'string') return;
    const sanitized = value.slice(0, 500); // Limit length
    setEditableText(prev => ({ ...prev, [field]: sanitized }));
  };

  // FIX: High - Safe string parsing helpers
  const safeParseProductName = (name) => {
    if (!name || typeof name !== 'string') return { main: '', last: '' };
    const parts = name.trim().split(' ');
    if (parts.length === 0) return { main: '', last: '' };
    if (parts.length === 1) return { main: '', last: parts[0] };
    return {
      main: parts.slice(0, -1).join(' '),
      last: parts[parts.length - 1]
    };
  };

  // FIX: High - Safe number formatting
  const safeFormatPrice = (price) => {
    const num = Number(price);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  // FIX: High - Safe discount percent validation
  const safeDiscountPercent = () => {
    const num = Number(discountPercent);
    if (isNaN(num) || num < 0 || num > 100) return 0;
    return Math.round(num);
  };

  // FIX: High - Safe features array validation
  const safeFeatures = Array.isArray(features) ? features : [];

  const productNameParts = safeParseProductName(editableText.productName);

  return (
    <div className="space-y-4">
      {/* Edit Toggle Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          {isEditing ? 'View Mode' : 'Edit Text'}
        </button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-300 space-y-4">
          <h3 className="font-bold text-lg mb-4">Edit Card Text</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={editableText.productName}
              onChange={(e) => handleTextChange('productName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={editableText.description}
              onChange={(e) => handleTextChange('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={editableText.buttonText}
              onChange={(e) => handleTextChange('buttonText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Type
            </label>
            <input
              type="text"
              value={editableText.licenseType}
              onChange={(e) => handleTextChange('licenseType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Note (appears at top)
            </label>
            <input
              type="text"
              value={editableText.customNote}
              onChange={(e) => handleTextChange('customNote', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a custom note..."
            />
          </div>
        </div>
      )}

      {/* Pricing Card */}
      <div className="w-full max-w-md mx-auto bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        {/* Custom Note */}
        {editableText.customNote && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 text-center">
            <p className="text-blue-800 text-sm font-medium">{editableText.customNote}</p>
          </div>
        )}
        {/* Product Name */}
        <div className="pt-12 pb-6 text-center relative">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {productNameParts.main}
          </h2>
          <p className="text-4xl font-bold text-red-600">
            {productNameParts.last}
          </p>

          {/* Description */}
          {editableText.description && (
            <p className="text-gray-600 text-sm mt-3 px-8">{editableText.description}</p>
          )}

          {/* Discount Badge */}
          <div className="absolute -top-2 right-8">
            <div className="relative">
              <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-lg">
                <circle cx="50" cy="50" r="45" fill="#dc2626" />
                <path
                  d="M50 5 L55 20 L70 15 L65 30 L80 30 L70 42 L80 55 L65 52 L70 67 L55 62 L50 77 L45 62 L30 67 L35 52 L20 55 L30 42 L20 30 L35 30 L30 15 L45 20 Z"
                  fill="#dc2626"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold">
                <div className="text-2xl leading-none">{safeDiscountPercent()}%</div>
                <div className="text-sm leading-none mt-1">OFF</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center pb-6">
          <div className="flex items-center justify-center gap-4">
            <span className="text-2xl text-gray-400 line-through">
              \${safeFormatPrice(originalPrice)}
            </span>
            <span className="text-5xl font-bold text-gray-900">
              \${safeFormatPrice(discountedPrice)}
            </span>
          </div>
        </div>

        {/* Select Button */}
        <div className="px-12 pb-8">
          <button className="w-full bg-[#2c4d6b] hover:bg-[#234159] text-white font-bold text-xl py-4 rounded transition-colors">
            {editableText.buttonText}
          </button>
        </div>

        {/* Includes Section */}
        <div className="border-t border-gray-300 px-8 py-6">
          <h3 className="text-center text-gray-700 font-bold text-lg mb-6">
            INCLUDES:
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {safeFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-800 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* License Type */}
        <div className="text-center py-4 text-gray-500 text-sm border-t border-gray-300">
          {editableText.licenseType}
        </div>
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  const decrement = () => {
    setCount(count - 1);
  };

  const reset = () => {
    setCount(0);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Counter</h2>
      <div className="text-4xl font-bold mb-6">{count}</div>
      <div className="flex gap-4">
        <button 
          onClick={decrement}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Decrease
        </button>
        <button 
          onClick={reset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
        <button 
          onClick={increment}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Increase
        </button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);";
      case "pricing":
        return '      <div className="relative z-10">';
      case "card":
        return '  const [isEditing, setIsEditing] = React.useState(false);';
      default:
        return "  const increment = () => setCount(count + 1);";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);\n    alert('Thank you! We\\'ll get back to you soon.');";
      case "pricing":
        return '      <div className="relative z-10 animate-fade-in">';
      case "card":
        return '  const [isEditing, setIsEditing] = React.useState(true);';
      default:
        return "  const increment = () => setCount(prev => prev + 1);";
    }
  }

  private getAppCode(componentName: string): string {
    if (componentName === "PricingCard") {
      return `import PricingCard from '@/components/PricingCard';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <PricingCard />
      </div>
    </div>
  );
}`;
    }

    if (componentName === "Card") {
      return `import Card from '@/components/Card';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <Card />
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <${componentName} />
      </div>
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.log("No ANTHROPIC_API_KEY found, using mock provider");
    return new MockLanguageModel("mock-claude-sonnet-4-0");
  }

  return anthropic(MODEL);
}
