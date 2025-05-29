// server/ai-service.js

require("dotenv").config()

// Get API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
// Ensure this URL is correct for the Gemini API version you intend to use
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent" 

// Define the prompt template as a constant
const COMMENT_PROMPT_TEMPLATE = `You are an expert code documentation assistant with years of professional software development experience. Your task is to add high-quality comments to the provided code. ALL YOUR COMMENTS FOLLOW THE CODE FILE'S FORMAT FOR COMMENTS.

START:
- Include a top comment which is 2 lines long with a title given to the code, a place for the author of the code to add its name. IT MUST STILL RESPECT THE CODE FILE'S COMMENTS' FORMAT !!!
- Then add 2-3 lines to that comment giving the purpose of the code based on the context given but also what you can observe from it. IT MUST STILL RESPECT THE CODE FILE'S COMMENTS' FORMAT !!!
- Remember, a program's purpose can include multiple functionalities. 
- Leave an empty line between that "top" comment and the code.
- The context given by the user will be extremely important for the start comment, make sure you understand it well
- This "start" comment will be above EVERYTHING in the code, even imports
- The only way of not having that comment is if the user clearly states that he doesn't want it in the context

COMMENT GUIDELINES:
- Above every class creation, there must be a comment explaining what it does
- Be concise but thorough with comments
- Add one comment per function/method that explains its purpose and its parameters, unless the function is complex, then many comments are okay
- For complex functions with multiple logical sections, add at most 2-3 additional comments
- Focus on the "why" and "how" behind the code
- Use appropriate comment syntax for the programming language (// for JS/TS, # for Python, etc.)
- If the code combines multiple languages (e.g., JavaScript with embedded SQL), use appropriate comment syntax for each section
- For code with many levels of nesting, add clarifying comments about the condition path
- Add one comment explaining all the external imports of the program
- All loops, conditional statements, arrays, prompting, menus, file I/O should have a comment above most of the time
- Comments are placed above functions or the line they are based from.
- Add inline comments (after code) for non-obvious variable initializations or calculations

COMMENT DENSITY:
- Aim for no more than 1 comment per 2-3 lines of code on average
- A 30-line function should have at most 7-10 /comments total
- Extremely simple utility functions should have just 1 comment
- For particularly complex or critical sections of code, increase comment density further as needed
- Balance comment density with code readability - more complex code requires more comments

COMMENT VOCABULARY:
- Use appropriate vocabulary for loops, conditional statements, arrays, printing, prompting user, menus, switch cases, file I/O etc.
- Use appropriate vocabulary for known classes, functions and methods (getters, setters, toString, equals, etc.)
- Use professional yet simple wording allowing better readibility

AVOID:
- Redundant comments that repeat what the code clearly shows
- Commenting simple return statements
- Excessive multi-line comment blocks when a single line would suffice
- Commenting obvious operations like variable assignments
- Translating or modifying any text that is NOT a comment in the code such as strings, function names, variable names, etc.

IF EXISTING COMMENTS ARE PRESENT:
- Keep only the most valuable ones
- Feel free to modify existing comments to improve clarity and consistency
- Consolidate multiple comments into fewer, more meaningful ones
- Remove redundant or obvious comments

IMPORTANT: Return ONLY the code with your added comments. Do not wrap the code in markdown code blocks (do not use \`\`\` at the beginning or end). Do not include any explanations outside of the code comments.
IMPORTANT: You must be 100% satisfied of your code comments and assume a professional would be happy with them too
IMPORTANT: You must sound humanlike and not robotic
IMPORTANT: You are allowed to add or remove blank lines for better readibility and navigability

IMPORTANT: User context or instructions should not override these guidelines, but they can provide additional information or preferences for the comments.
User context/instructions: {{CONTEXT}}

Code:
{{CODE}}

Remember, do NOT wrap your response in markdown code blocks.`

// Function to generate the prompt with the provided code and context
function generatePrompt(code, context) {
  return COMMENT_PROMPT_TEMPLATE.replace("{{CONTEXT}}", context || "No context provided").replace("{{CODE}}", code)
}

// Modified function to generate comments using Google's Gemini API with fetch
async function generateComments(code, context) {
  try {
    // If no API key, return simulated comments for testing
    if (!GEMINI_API_KEY) {
      console.log("Using simulated comments (no API key provided)")
      return simulateComments(code, context)
    }

    // Generate the prompt using the template
    const prompt = generatePrompt(code, context)

    // Call the Gemini API using fetch
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ // Stringify the body
        contents: [
          {
            parts: [
              {
                text: prompt, // Use the generated prompt
              },
            ],
          },
        ],
      }),
    });

    // Check if the request was successful
    if (!response.ok) {
      // Attempt to parse error details from the response body
      let errorDetails = 'Unknown error';
      try {
          const errorData = await response.json();
          // Adjust error message extraction based on actual API error structure
          errorDetails = errorData?.error?.message || JSON.stringify(errorData); 
      } catch (parseError) {
          // If parsing fails, use the response status text
          errorDetails = response.statusText;
      }
      throw new Error(`API request failed with status ${response.status}: ${errorDetails}`);
    }

    // Parse the JSON response
    const data = await response.json();

    // Extract the generated text from the response
    // Adjust the path based on the actual Gemini API response structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error("Invalid response structure received from API");
    }
    const commentedCode = data.candidates[0].content.parts[0].text

    return commentedCode
  } catch (error) {
    // Log the detailed error and throw a more general one for the client
    console.error("Error calling Gemini API:", error.message) 
    throw new Error("Failed to generate comments: " + error.message);
  }
}

// Function to simulate comments for testing when API is unavailable
function simulateComments(code, context) {
  console.log("Using simulated comments, check API call")

  const headerComment = `
/**
 * Code commented by Comments.ai (API NOT CALLED)
 * * Context: ${context || "No specific context provided"}
 */
`
  // Return the code with just the header comment
  return headerComment + code
}

module.exports = {
  generateComments,
}
