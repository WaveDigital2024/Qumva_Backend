const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail', // You can use other services like Yahoo, Outlook, etc.
    auth: {
        user: 'qumvanetwork@gmail.com', // Your email
        pass: 'kpckppfsuylpqabe'   // Your email password or app-specific password
    }
});

const sendOtp = (email, otp) => {
    const mailOptions = {
        from: 'qumvanetwork@gmail.com',
        to: email,
        subject: 'Qumva OTP Verification',
        text: `Thank you for joining Qumva Community.Your Gmail Verification OTP is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

module.exports = { sendOtp };
