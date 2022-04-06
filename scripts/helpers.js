function handleError(error) {
  if (error.isAxiosError) {
    console.error((error.response && error.response.data) || error);
  } else {
    console.error(error);
  }
}

function sleep(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { handleError, sleep };
