function getTimeBasedGreeting(name: string): string {
  const hour = new Date().getHours();

  const morningGreetings = [
    `Good morning, ${name}! Hope your morning is going well.`,
    `Good morning, ${name}! Hope you're having a bright start to your day.`,
    `Good morning, ${name}! Trust you're having a wonderful morning.`,
    `Good morning, ${name}! Hope your day is off to a great start.`,
    `Good morning, ${name}! Wishing you a productive and blessed morning.`,
  ];

  const afternoonGreetings = [
    `Good afternoon, ${name}! Hope you're having a wonderful day.`,
    `Good afternoon, ${name}! Hope your afternoon is treating you well.`,
    `Good afternoon, ${name}! Trust your day is going smoothly.`,
    `Good afternoon, ${name}! Hope you're having a productive afternoon.`,
    `Good afternoon, ${name}! Wishing you a pleasant rest of your day.`,
  ];

  const eveningGreetings = [
    `Good evening, ${name}! Hope your evening is treating you kindly.`,
    `Good evening, ${name}! Hope you're winding down nicely.`,
    `Good evening, ${name}! Trust you've had a wonderful day.`,
    `Good evening, ${name}! Hope you're having a relaxing evening.`,
    `Good evening, ${name}! Wishing you a peaceful end to your day.`,
  ];

  const getRandomGreeting = (greetings: string[]) => {
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  if (hour < 12) {
    return getRandomGreeting(morningGreetings);
  } else if (hour < 17) {
    return getRandomGreeting(afternoonGreetings);
  } else {
    return getRandomGreeting(eveningGreetings);
  }
}

export async function mainMenuMessageTemplate(name: string, mobile: string) {
  //const greeting = getTimeBasedGreeting(name);

  return {
    body: {
      text: `CRMS Field Tools*\n\nWelcome, Officer! Select a check type below:`,
    },
    footer: {
      text: "Sierra Leone Police - CRMS",
    },
    action: {
      list: {
        sections: [
          {
            title: "Person Checks",
            rows: [
              {
                id: "wanted",
                title: "🚨 Wanted Person",
                description: "Check if person has active warrant",
              },
              {
                id: "missing",
                title: "🔎 Missing Person",
                description: "Check missing/deceased status",
              },
              {
                id: "background",
                title: "📋 Background Check",
                description: "Full criminal record check",
              },
            ],
          },
          {
            title: "Other checks",
            rows: [
              {
                id: "vehicle",
                title: "🚗 Vehicle Check",
                description: "Check stolen vehicle status",
              },
              {
                id: "stats",
                title: "📊 My Statistics",
                description: "View your query statistics",
              },
            ],
          },
        ],
        label: "Select a check type below:",
      },
    },
    type: "list",
    to: mobile,
    media:
      "https://slfa.sl/wp-content/uploads/2022/01/Sierra-Leone-Police-FC.jpg",
  };
}

export async function pinPromptTemplate() {
  return `🔐 *Authentication Required*\n\nPlease enter your 4-digit Quick PIN:`;
}

/** Wanted Person Template */

export async function wantedPersonTemplate() {
  return "Wanted Person Check*\n\nEnter the National Identification Number (NIN) to search:";
}

export async function wantedPersonFoundTemplate(result: any) {
  return `⚠️ *WANTED PERSON ALERT*\n━━━━━━━━━━━━━━━━━━━━\n\n👤 *Name:* ${
    result.name
  }\n🆔 *NIN:* ${result.nin}\n\n⚖️ *Charges:*\n• ${result.charges.join(
    "\n• "
  )}\n\n🔴 *Danger Level:* ${result.dangerLevel.toUpperCase()}\n📜 *Warrant:* ${
    result.warrantNumber
  }\n\n━━━━━━━━━━━━━━━━━━━━\n_Exercise extreme caution. Contact dispatch immediately._\n\nReply with any message to start a new search.`;
}

export async function wantedPersonNotFoundTemplate(result: any) {
  return `✅ *NO ACTIVE WARRANTS*\n━━━━━━━━━━━━━━━━━━━━\n\n👤 *Name:* ${result.name}\n🆔 *NIN:* ${result.nin}\n\n_No criminal record found._\n\nReply with any message to start a new search.`;
}

/** Missing Person Template */
export async function missingPersonTemplate() {
  return "Missing Person Check*\n\nEnter the National Identification Number (NIN) to search:";
}

export async function missingPersonFoundTemplate(result: any) {
  return `⚠️ *MISSING PERSON ALERT*\n━━━━━━━━━━━━━━━━━━━━\n\n👤 *Name:* ${
    result.name
  }\n🆔 *NIN:* ${result.nin}\n\n⚖️ *Charges:*\n• ${result.charges.join(
    "\n• "
  )}\n\n🔴 *Danger Level:* ${result.dangerLevel.toUpperCase()}\n📜 *Warrant:* ${
    result.warrantNumber
  }\n\n━━━━━━━━━━━━━━━━━━━━\n_Exercise extreme caution. Contact dispatch immediately._\n\nReply with any message to start a new search.`;
}

export async function missingPersonNotFoundTemplate(result: any) {
  return `✅ *NO ACTIVE WARRANTS*\n━━━━━━━━━━━━━━━━━━━━\n\n👤 *Name:* ${result.name}\n🆔 *NIN:* ${result.nin}\n\n_No criminal record found._\n\nReply with any message to start a new search.`;
}

/** Background Check Template */
export async function backgroundCheckTemplate() {
  return "Background Check*\n\nEnter the National Identification Number (NIN) to search:";
}

export async function backgroundCheckFoundTemplate(result: any) {
  return `⚠️ *BACKGROUND CHECK ALERT*\n━━━━━━━━━━━━━━━━━━━━\n\n👤 *Name:* ${
    result.name
  }\n🆔 *NIN:* ${result.nin}\n\n⚖️ *Charges:*\n• ${result.charges.join(
    "\n• "
  )}\n\n🔴 *Danger Level:* ${result.dangerLevel.toUpperCase()}\n📜 *Warrant:* ${
    result.warrantNumber
  }\n\n━━━━━━━━━━━━━━━━━━━━\n_Exercise extreme caution. Contact dispatch immediately._\n\nReply with any message to start a new search.`;
}

export async function backgroundCheckNotFoundTemplate(result: any) {
  return `✅ *NO ACTIVE WARRANTS*\n━━━━━━━━━━━━━━━━━━━━\n\n👤 *Name:* ${result.name}\n🆔 *NIN:* ${result.nin}\n\n_No criminal record found._\n\nReply with any message to start a new search.`;
}

/** Vehicle Check Template */
export async function vehicleCheckTemplate() {
  return "Vehicle Check*\n\nEnter the Vehicle Registration Number (VRN) to search:";
}

export async function vehicleCheckFoundTemplate(result: any) {
  return `⚠️ *VEHICLE CHECK ALERT*\n━━━━━━━━━━━━━━━━━━━━\n\n🚗 *Vehicle:* ${
    result.vehicle
  }\n🆔 *VRN:* ${result.vrn}\n\n⚖️ *Charges:*\n• ${result.charges.join(
    "\n• "
  )}\n\n🔴 *Danger Level:* ${result.dangerLevel.toUpperCase()}\n📜 *Warrant:* ${
    result.warrantNumber
  }\n\n━━━━━━━━━━━━━━━━━━━━\n_Exercise extreme caution. Contact dispatch immediately._\n\nReply with any message to start a new search.`;
}

export async function vehicleCheckNotFoundTemplate(result: any) {
  return `✅ *NO ACTIVE WARRANTS*\n━━━━━━━━━━━━━━━━━━━━\n\n🚗 *Vehicle:* ${result.vehicle}\n🆔 *VRN:* ${result.vrn}\n\n_No criminal record found._\n\nReply with any message to start a new search.`;
}

/** Error Template */
export async function errorTemplate(error: string) {
  return `❌ *ERROR*\n━━━━━━━━━━━━━━━━━━━━\n\n${error}\n\n_Please try again._\n\nReply with any message to start a new search.`;
}

/** Success Template */
export async function successTemplate(message: string) {
  return `✅ *SUCCESS*\n━━━━━━━━━━━━━━━━━━━━\n\n${message}\n\n_Thank you for using CRMS Field Tools._\n\nReply with any message to start a new search.`;
}

export async function invalidPinTemplate() {
  return `❌ *Invalid Quick PIN*\n\nThe PIN you entered is incorrect. Please try again.\n\nReply with any message to restart.`;
}

export async function invalidPhoneNumberTemplate() {
  return `❌ *Phone Not Registered*\n\nThis phone number is not registered for CRMS access.\n\nPlease contact your station commander to register for USSD/WhatsApp access.`;
}
