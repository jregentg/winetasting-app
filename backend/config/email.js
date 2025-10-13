const nodemailer = require('nodemailer');

// Configuration de l'envoi d'emails
const createTransporter = () => {
    // Pour le développement, utiliser un faux serveur SMTP ou Gmail
    // En production, utiliser un vrai service email (SendGrid, Mailgun, etc.)
    
    if (process.env.NODE_ENV === 'production' || process.env.SEND_REAL_EMAILS === 'true') {
        // Configuration pour production ou test avec vrais emails
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            return nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_PORT == 465, // true pour 465, false pour 587
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            console.warn('⚠️ Variables SMTP non configurées, utilisation du mode simulation');
        }
    }
    
    // Mode développement ou fallback
    return {
        sendMail: async (mailOptions) => {
            console.log('📧 ================================');
            console.log('📧 SIMULATION EMAIL EN DÉVELOPPEMENT');
            console.log('📧 ================================');
            console.log('📧 Destinataire:', mailOptions.to);
            console.log('📧 Sujet:', mailOptions.subject);
            console.log('📧 Expéditeur:', mailOptions.from);
            
            // Extraire le lien d'activation du HTML
            const linkMatch = mailOptions.html.match(/href="([^"]+)"/);
            if (linkMatch) {
                console.log('🔗 LIEN D\'ACTIVATION:', linkMatch[1]);
                console.log('📧 ================================');
                console.log('📱 Pour tester, copiez ce lien dans votre navigateur');
                console.log('📧 ================================');
            }
            
            return {
                messageId: 'dev-sim-' + Date.now(),
                response: 'Email simulé en développement'
            };
        }
    };
};

// Envoyer un email d'invitation à un participant
const sendParticipantInvitation = async (participantEmail, participantName, setupLink) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: '"Wine Tasting App" <noreply@winetasting.app>',
            to: participantEmail,
            subject: '🍷 Invitation à une dégustation de vin',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #8B0000; margin: 0;">🍷 Wine Tasting App</h1>
                        <p style="color: #666; margin: 10px 0;">Application de dégustation de vin</p>
                    </div>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                        <h2 style="color: #333; margin: 0 0 15px 0;">Bonjour ${participantName},</h2>
                        <p style="color: #555; line-height: 1.6; margin: 0 0 15px 0;">
                            Vous avez été invité(e) à participer à une dégustation de vin via notre application.
                        </p>
                        <p style="color: #555; line-height: 1.6; margin: 0;">
                            Pour commencer, vous devez d'abord configurer votre mot de passe en cliquant sur le lien ci-dessous.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${setupLink}" 
                           style="background: #8B0000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Configurer mon mot de passe
                        </a>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <h3 style="color: #1976d2; margin: 0 0 10px 0;">📱 Accès mobile</h3>
                        <p style="color: #555; margin: 0; font-size: 14px;">
                            L'application fonctionne parfaitement sur smartphone et tablette.
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
                        <p style="color: #888; font-size: 12px; margin: 0;">
                            Si vous ne pouvez pas cliquer sur le lien, copiez et collez cette URL dans votre navigateur :<br>
                            <span style="color: #666; word-break: break-all;">${setupLink}</span>
                        </p>
                        <p style="color: #888; font-size: 12px; margin: 10px 0 0 0;">
                            Ce lien est valide pendant 24 heures.
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email envoyé:', info.messageId);
        
        // En développement, afficher le lien de test Ethereal
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
        }
        
        return {
            success: true,
            messageId: info.messageId
        };
        
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    sendParticipantInvitation
};