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

function ignoreError(prom, errorValue = null) {
  return prom.then(
    (data) => data,
    (err) => {
      console.error(err);
      return errorValue;
    },
  );
}

module.exports = { handleError, sleep, ignoreError };
