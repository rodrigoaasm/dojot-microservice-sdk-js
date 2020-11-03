/**
 * A helper function to get the current
 * status of a given consumer or producer
 * @param {*} kafkaObject The kafka Object to get
 * the metadata Consumer or Producer (required)
 * @param {*} timeout Timeout to get the status (optional)
 */
const getStatus = (kafkaObject, timeout = 3000) => new Promise((resolve, reject) => {
  const objectStatus = { connected: false };

  if (!kafkaObject) {
    reject(new Error('Internal error while getting kafka metadata.'));
  }

  kafkaObject.getMetadata({ timeout }, (err, metadata) => {
    if (err) {
      reject(new Error(`Internal error while getting kafka metadata. ${err}`));
    } else {
      objectStatus.connected = true;
      objectStatus.details = { metadata };
      resolve(objectStatus);
    }
  });
});

module.exports = { getStatus };
