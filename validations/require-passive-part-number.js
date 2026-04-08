exports.validate = async function(data) {
  const { items } = data;

  // Part Number attribute ID from attributes.json
  const PART_NUMBER_ID = '91481e3f-b43d-48df-b802-239f1392aead';

  // Passive component categories (case-insensitive)
  const PASSIVE_CATEGORIES = ['capacitor', 'resistor', 'diode'];

  // Helper to create component links
  function componentLink(item) {
    const display = item.name || item.eid || item.itemId;
    return `[${display}](item:component/${item.itemId})`;
  }

  // Filter for passive components missing part number
  const missingPartNumber = items.filter(item => {
    const isPassive = item.category &&
      PASSIVE_CATEGORIES.includes(item.category.name.toLowerCase());

    if (!isPassive) return false;

    const partNumber = item.attributeValues?.[PART_NUMBER_ID]?.value;
    return !partNumber || partNumber.trim() === '';
  });

  if (missingPartNumber.length > 0) {
    console.info(`Found ${missingPartNumber.length} passive component(s) without Part Number`);

    missingPartNumber.forEach(item => {
      const category = item.category?.name || 'unknown';
      console.error(`${componentLink(item)} (${category}) is missing Part Number`);
    });

    const linkedNames = missingPartNumber
      .map(item => componentLink(item))
      .join(', ');

    return {
      valid: false,
      message: `${missingPartNumber.length} passive component(s) missing Part Number: ${linkedNames}`
    };
  }

  console.info('All passive components have Part Number');
  return { valid: true, message: 'All passive components have Part Number' };
}
