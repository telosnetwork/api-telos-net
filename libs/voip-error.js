
export function VoipError(message, extra) {
    const error  = new Error(message);
    error.name = 'VoipError';
    if (extra) {
          error.extra = extra;
     }

    return error;
}