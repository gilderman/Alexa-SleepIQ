const Alexa = require('ask-sdk-core');
var API = require('./API.js');

const messages = {
  WELCOME:'Welcome, you can say Help or ask me to change your bed settings',
  OK:'Sure, my pleasure',
  ERROR: 'Uh Oh. Looks like something went wrong.',
  ERROR1: 'Sorry, I had trouble doing what you asked. Please try again.',
  GOODBYE: 'Bye! Thanks for using smart bed skill!',
  UNHANDLED: 'This skill doesn\'t support that. Please ask something else.',
  HELP: 'You can say move my head or legs up or down, you can also ask to set the bed in one of the presets such as: read, watch tv, zero gravity, snore, or favorite, finally you can add on the left or on the right',
};

const SleepIQ = {
    USERNAME: __YUOR_SLEEPIQ_USERNAME__,
    PASSWORD: __YOUR_SLEEPIQ_PASSWORD__
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.WELCOME)
            .reprompt(messages.WELCOME)
            .getResponse();
    }
};
const BedMovementIntentHandler = {
    canHandle(handlerInput) {
        return doCanHandle(handlerInput, 'BedMovementIntent');
    },
    handle(handlerInput) {
        return doHandleIntent(handlerInput, (api, slots, intentLogicCallbackCallback) => { //intentLogicCallback(api, slots, intentLogicCallbackCallback)
            var actuator = slots.BedParts.resolutions.resolutionsPerAuthority[0].values[0].value.id
            var num = slots.BedDirections.resolutions.resolutionsPerAuthority[0].values[0].value.id
            console.log(`Calling bed movement with actuator ${actuator} and num=${num}`);
            
	        api.adjust (actuator, num, intentLogicCallbackCallback);
        });
    }
};
const PresetIntentHandler = {
    canHandle(handlerInput) {
        return doCanHandle(handlerInput, 'PresetIntent');
    },
    handle(handlerInput) {
        return doHandleIntent(handlerInput, (api, slots, intentLogicCallbackCallback) => { //intentLogicCallback(api, slots, intentLogicCallbackCallback)
            var preset = slots.Preset.resolutions.resolutionsPerAuthority[0].values[0].value.id
        	console.log(`Calling preset with ${preset}`);
        	
        	api.preset(preset, intentLogicCallbackCallback);
        });
    }
};
const WarmerIntentHandler = {
    canHandle(handlerInput) {
        return doCanHandle(handlerInput, 'WarmerIntent');
    },
    handle(handlerInput) {
        const timer = 120;
        return doHandleIntent(handlerInput, (api, slots, intentLogicCallbackErrorCallback) => { //intentLogicCallback(api, slots, intentLogicCallbackErrorCallback)
            var temp = slots.TempOptions.resolutions.resolutionsPerAuthority[0].values[0].value.id
            console.log(`Calling footwarming with ${temp} temperature for ${timer} min`);
            
            api.footwarming(temp, timer, intentLogicCallbackErrorCallback); 
        });
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = messages.HELP;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = messages.GOODBYE;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = messages.UNHANDLED;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = messages.ERROR1;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

function doAPISetup (onAPISetupSuccessCallback) {
    console.log('Creating API object...');
	var api = new API(SleepIQ.USERNAME, SleepIQ.PASSWORD);
	        
	console.log('SleepIQ Authenticating...');
	api.login((data, err=null) => {
	    if (err) {
	        console.log(data, err);
        } 
        else {
            console.log('Getting bed status...');
            api.familyStatus(() => {
                if (onAPISetupSuccessCallback) {
                    onAPISetupSuccessCallback(api);
                }
            })
        }
	})
}

function getBedSide(slots) {
    var side = 'L' // default
    
    if (slots.BedSide && 
        slots.BedSide.resolutions &&
        slots.BedSide.resolutions.resolutionsPerAuthority &&
        slots.BedSide.resolutions.resolutionsPerAuthority[0] &&
        slots.BedSide.resolutions.resolutionsPerAuthority[0].values[0]) {
        side = slots.BedSide.resolutions.resolutionsPerAuthority[0].values[0].value.id
    }
    console.log('BED SIDE: ' + side);
    return side;
}

function doCanHandle(handlerInput, intentName) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === intentName;
}

async function doHandleIntent(handlerInput, intentLogicCallback) {
    try {
        const person = handlerInput.requestEnvelope.context.System.person;
        var speakOutput = messages.OK
        if (person) { 
            speakOutput = speakOutput + "<alexa:name type=\"first\" personId=\"" + person.personId + "\"/>";
        }

        var slots = handlerInput.requestEnvelope.request.intent.slots;
        
        doAPISetup((api) => {
            // This will not work untill Alexa will support something like
            // var givenName = Alexa.getSpeakerGivenName(person.personId);
            // for now we need to get the value from the slot
            // api.setBedSide(getBedSide(givenName));
            
            api.setBedSide(getBedSide(slots));
            
            if (intentLogicCallback) {
                intentLogicCallback(api, slots, (data, err=null) => { //intentLogicCallbackErrorCallback
                	if (err) {
        	            console.log(data, err);
        	            speakOutput = messages.ERROR;
                	}
                });
            }
        }); 
    } catch(error) {
        speakOutput = messages.ERROR;
    } 

    return handlerInput.responseBuilder
        .speak(speakOutput)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse();
}

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        BedMovementIntentHandler,
        PresetIntentHandler,
        WarmerIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();
