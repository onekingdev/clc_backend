export const enableCors = (response: any) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,HEAD');
    response.set('Access-Control-Allow-Headers', '*');
    // response.set('Access-Control-Max-Age', '3600');

    return response;
}