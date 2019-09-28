export function success(body) {
  body.success = "true";
  console.log("Body: ", body);
  return buildResponse(200, body);
}

export function failure(body) {
  body.success = "false";
  return buildResponse(500, body);
}

export function respond (httpCode, body) {
  return buildResponse(httpCode, body);
}

function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify(body)
  };
}

export function twilioSuccess(body) {
  return buildTwilioResponse(200, body);
}

export function twilioError(body) {
  return buildTwilioResponse(500, body);
}

function buildTwilioResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    body: body
  };
}
