exports.validate = async function(data) {
  const { items } = data;

  function componentLink(item) {
    const display = item.name || item.eid || item.itemId;
    return `[${display}](item:component/${item.itemId})`;
  }

  const PIN_COUNT_ATTR_ID = 'a771f5e2-93be-42ee-b2ed-6bedcb19c701';

  const connectors = items.filter(item =>
    item.category?.name?.toLowerCase() === 'connector'
  );

  console.info(`Found ${connectors.length} connector(s) in this change order`);

  const invalid = connectors.filter(item => {
    const raw = item.attributeValues?.[PIN_COUNT_ATTR_ID]?.value;
    if (raw === undefined || raw === null || String(raw).trim() === '') return true;
    const num = Number(raw);
    return !Number.isInteger(num) || num <= 0;
  });

  if (invalid.length > 0) {
    invalid.forEach(item => {
      const raw = item.attributeValues?.[PIN_COUNT_ATTR_ID]?.value;
      const msg = raw === undefined || raw === null || String(raw).trim() === ''
        ? `${componentLink(item)} is missing a Pin Count`
        : `${componentLink(item)} has invalid Pin Count: "${raw}" (must be a positive integer)`;
      console.error(msg);
    });

    const linkedNames = invalid.map(componentLink).join(', ');
    return {
      valid: false,
      message: `${invalid.length} connector(s) with missing or invalid Pin Count: ${linkedNames}`
    };
  }

  console.info('All connectors have a valid Pin Count');
  return { valid: true, message: 'Connector Pin Count check passed' };
}
