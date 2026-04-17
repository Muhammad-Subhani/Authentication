function generate_OTp() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

const generateEmailTemplate = (otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          width: 100%;
          table-layout: fixed;
          background-color: #f4f4f4;
          padding-bottom: 40px;
        }
        .content {
          background-color: #ffffff;
          max-width: 400px;
          margin: 40px auto;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #4CAF50;
          letter-spacing: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <h2 style="color: #333;">Verification Code</h2>
          <p style="color: #666;">Use the code below to verify your account:</p>
          <div class="otp-code">${otp}</div>
          <p style="color: #999; font-size: 12px;">This code expires in 10 minutes.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
module.exports = {
  generate_OTp,
  generateEmailTemplate
}
