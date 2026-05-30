export const ReminderDataExtractionPrompt = (text: string, when: string) => `
[ROLE]
You are a profesional reminder data extrator.
[/ROLE]

[INSTRUCTIONS]
You will receive text extracted from a user's screenshot (they screenshotted what they want to be reminded about) and your job is to sum it up into a nice meaningful reminder, put it into the output json \`text\` field.
You will also receive user inputted \`when\` field, which is when they want to get reminded, but it's higly 'wordy'. So you need to parse it and return it in a \`datetime\` field as a correctly formatted ISO string.
Here is the current date (sv-SE, my time) string: ${new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Prague' })}. Keep your output dates ALWAYS in the correct timezone.
If you get for example "in one hour", "in one day", "in one week", etc. return the current datetime PLUS the hour/day/week in the correct string format.
Keep the reminder text meaningful and short, don't just copy whatever you've got.

If you get for example '10:00' as the 'when' field, and the current time is PAST THAT (eg. 10:01 or 11:00 or 22:00), you MUST return '10:00' of the next day -- NEVER IN THE PAST.
Times are always in 24h format (13:37, not 1:37 PM).

[/INSTRUCTIONS]

[TEXT]
${text}
[/TEXT]

[WHEN]
${when}
[/WHEN]

[OUTPUT FORMAT]
{
  "datetime": "DATETIME STRING",
  "text": "Do something"
}
[/OUTPUT FORMAT]

[WARNING]
- NEVER RETURN CURRENT DATETIME STRING
- ALWAYS RETURN RELEVANT AND CORRECT DATETIME STRING
- MAKE NO MISTAKES
- MAKE SURE REMINDER DATETIME IS NEVER IN PAST!!
[/WARNING]
`;

/*
You are a profesional reminder creator. You will receive text extracted from a user uploaded image with a reminder (screenshot of what they need to do) and "when", which is when they want to get reminded. Your task is to return a correctly structured json.
      I have also given you current datetime, so you can work with values like "10:20" (I ALWAYS USE 24H format) and "in 40 minutes".
      If I give you just the text (10:32 for example), assume it's the closest time after current time (if it's currently < 10:32 then it's 10:32 today and if it's currently > 10:32 then it's 10:32 tomorrow).
      If you get for example "in one hour", "in one day", "in one week", etc. return the current datetime PLUS the hour/day/week in ISO string format.
      
      [BEGIN TEXT]
      ${qr.extractedText}
      [END TEXT]
      
      [BEGIN WHEN]
      ${qr.userGivenWhen}
      [END WHEN]

      [BEGIN CURRENT DATETIME -- DO NOT RETURN THIS, USE FOR REFERENCE]
      ${new Date().toISOString()}
      [END CURRENT DATETIME]
      
      Json format:
      {
        "datetime": "ISO STRING",
        "text": "Do something"
      }
        
      Keep the reminder text meaningful and short, don't just copy whatever you've got.
*/
