class ApiResponse {
  /**
   * @param {number} statusCode - The HTTP status code.
   * @param {any} data - The data payload to be included in the response.
   * @param {string} message - A success message.
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };