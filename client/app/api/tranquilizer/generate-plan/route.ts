import { NextResponse } from 'next/server';
import { createChatCompletion, Message } from '@/lib/deepseek';

export async function POST(request: Request) {
  try {
    const { tasks } = await request.json();

    if (!tasks) {
      return NextResponse.json(
        { error: 'Tasks are required' },
        { status: 400 }
      );
    }

    // Get current time in Beijing time (UTC+8)
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Shanghai'
    });

    const prompt = `You are an expert productivity coach. Analyze the following tasks and create a detailed plan to tackle them effectively. Return the response in this exact JSON format:

{
  "daily_timeline": [
    { "time": "HH:MM AM/PM", "task": "task description" }
  ],
  "date_based_timeline": [
    {
      "date": "MM/DD",
      "tasks": [
        { "time": "HH:MM AM/PM", "task": "task description" }
      ]
    }
  ],
  "priorities": [
    {
      "title": "priority level",
      "description": "explanation of why these tasks are at this priority"
    }
  ],
  "tips": [
    "specific, actionable tip for success"
  ]
}

Guidelines:
1. Create a realistic timeline considering task complexity and dependencies
2. Group tasks by priority level (High, Medium, Low)
3. Consider time of day for optimal productivity
4. Include short breaks between tasks
5. Provide specific, actionable tips for success
6. Consider task dependencies and logical order
7. Account for energy levels throughout the day
8. For date-based timeline:
   - Use actual dates (MM/DD format) instead of days of the week
   - Distribute tasks based on their deadlines
   - Group related tasks on the same date when possible
   - Consider workload balance across dates
   - Account for recurring tasks
   - Include buffer days for unexpected issues
9. For daily timeline:
   - Start scheduling from the current Beijing time (${currentTime})
   - Focus on today's most urgent tasks
   - Consider natural energy patterns
   - Include buffer time for unexpected issues
   - Schedule complex tasks during peak productivity hours
   - Ensure tasks are realistically spaced out from the current time
   - All times should be in Beijing time (UTC+8)
   - Do not schedule tasks before the current time
   - Consider typical work hours in Beijing (9:00 AM - 6:00 PM)

Tasks to analyze:
${tasks}`;

    const messages: Message[] = [
      { role: 'system', content: 'You are an expert productivity coach that creates detailed, actionable plans.' },
      { role: 'user', content: prompt }
    ];

    const response = await createChatCompletion(messages);
    
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const plan = JSON.parse(jsonMatch[0]);
      return NextResponse.json(plan);
    } catch (error) {
      console.error('Error parsing DeepSeek response:', error);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error generating plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
} 