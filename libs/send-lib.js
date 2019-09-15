import twilio from 'twilio';

export async function cleanNumberFormat (smsNumber) {
    const accountSid = process.env.twilioAccountSid; // Your Account SID from www.twilio.com/console
    const authToken = process.env.twilioAuthToken;   // Your Auth Token from www.twilio.com/console

    const client = new twilio(accountSid, authToken);

    let cleanNumber = smsNumber;
    await client.lookups.phoneNumbers(smsNumber)
              .fetch()
              .then(phone_number => {
                  cleanNumber = phone_number.phoneNumber;
              });
    return cleanNumber;
}

export async function genSendSMS(smsNumber, message) {
    const accountSid = process.env.twilioAccountSid; // Your Account SID from www.twilio.com/console
    const authToken = process.env.twilioAuthToken;   // Your Auth Token from www.twilio.com/console

    const client = new twilio(accountSid, authToken);

    return await client.messages.create({
        body: message,
        to: smsNumber,
        from: '+19893683567' // From a valid Twilio number
    });
}

export async function sendSMS(smsNumber, otp) {
    const accountSid = process.env.twilioAccountSid; // Your Account SID from www.twilio.com/console
    const authToken = process.env.twilioAuthToken;   // Your Auth Token from www.twilio.com/console

    const client = new twilio(accountSid, authToken);

    return await client.messages.create({
        body: `Your Telos enrollment codee is ${otp}`,
        to: smsNumber,
        from: '+19893683567' // From a valid Twilio number
    });
}

export async function sendError (message) {
    await genSendSMS('19196738460', message);
}