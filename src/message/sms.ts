// TODO : implement sms service
export async function SendSMS(phoneNumber: string, message: string):Promise<boolean> {
    try {
        console.log("Sending ",message, " to ",phoneNumber);
      //  let m = await fetch(`https://sms.arkesel.com/sms/api?action=send-sms&api_key=${Bun.env.ARKESEL}&to=${phoneNumber}&from=${Bun.env.SENDER_ID}&sms=${message}`, {
      //       method: "GET",
      //     });
      //    console.log(await m.json());
      } catch (error:any) {
        throw Error(error.toString());
      }
    console.log(message);
    return true
}