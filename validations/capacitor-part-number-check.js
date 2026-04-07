exports.validate = async function(data) {
  const { items } = data;

  function componentLink(item) {
    const display = item.name || item.eid || item.itemId;
    return `[${display}](item:component/${item.itemId})`;
  }

  const capacitors = items.filter(item =>
    item.category?.name?.toLowerCase() === 'capacitor'
  );

  console.info(`Found ${capacitors.length} capacitor(s) in this change order`);

  const missing = capacitors.filter(item => {
    const partNumber = item.attributeValues?.['Part Number'];
    return !partNumber || String(partNumber).trim() === '';
  });

  if (missing.length > 0) {
    missing.forEach(item => {
      console.error(`${componentLink(item)} is missing a Part Number`);
    });

    const linkedNames = missing.map(componentLink).join(', ');
    return {
      valid: false,
      message: `${missing.length} capacitor(s) missing Part Number: ${linkedNames}`
    };
  }

  console.info('All capacitors have a Part Number');
  return { valid: true, message: 'Capacitor Part Number check passed' };
}
