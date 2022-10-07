const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
const config = require('../config/recaptcha');

async function requestAssessment (req) {
  if (!config.GOOGLE_RECAPTCHA_ENABLED) {
    return 0.7;
  }

  const client = new RecaptchaEnterpriseServiceClient({
    credentials: {
      client_email: config.GOOGLE_RECAPTCHA_EMAIL,
      // https://github.com/auth0/node-jsonwebtoken/issues/642#issuecomment-585173594
      private_key: config.GOOGLE_RECAPTCHA_PRIVATE_KEY.replace(/\\n/gm, '\n')
    },
    projectId: config.GOOGLE_RECAPTCHA_PROJECT_ID,
  });
  await client.initialize();

  const expectedAction = 'submit';
  const request = {
    assessment: {
      event: {
        token: req.body['g-recaptcha-response'],
        siteKey: config.GOOGLE_RECAPTCHA_SITE_KEY,
        userAgent: req.headers['user-agent'],
        userIpAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        expectedAction: expectedAction
      }
    },
    parent: client.projectPath(config.GOOGLE_RECAPTCHA_PROJECT_ID)
  };

  return new Promise ((resolve, reject) => {
    client.createAssessment(request, (error, response) => {
      if (error) {
        // send 500 response here and log the error
        reject(error);
      }

      if (response.tokenProperties.valid == false) {
        reject(response.tokenProperties.invalidReason);
      } else {
        if (response.event.expectedAction == expectedAction) {
          if (parseFloat(response.riskAnalysis.score) >= 0.7) {
            // successful captcha, run any code you want here now and send 200 response
            resolve(response.riskAnalysis.score);
          } else {
            // send 400 response and possibly reason: response.riskAnalysis.reasons
            reject(response.riskAnalysis.reasons);
          }
        } else {
          // send 400 response
          reject('Unexpected Action');
        }
      }
    });
  });
}

exports.requestAssessment = requestAssessment;
