exports.validate = async function(data) {
  const { items } = data;

  // Part Number attribute ID from attributes.json
  const PART_NUMBER_ID = '91481e3f-b43d-48df-b802-239f1392aead';

  // List of passive component categories to check
  const PASSIVE_CATEGORIES = [
    'capacitor',
    'resistor',
    'diode',
    'inductor',
    'transformer',
    'ferrite',
    'varistor',
    'thermistor'
  ];

  // Helper function to create component links
  function componentLink(item) {
    const display = item.name || item.eid || item.itemId;
    return `[${display}](item:component/${item.itemId})`;
  }

  // Filter for passive components
  const passiveComponents = items.filter(item => {
    const categoryName = item.category?.name?.toLowerCase() || '';
    return PASSIVE_CATEGORIES.some(passive =>
      categoryName.includes(passive)
    );
  });

  console.info(`Checking ${passiveComponents.length} passive components for Part Number attribute`);

  // Check each passive component for Part Number
  const missingPartNumber = passiveComponents.filter(item => {
    const partNumber = item.attributeValues?.[PART_NUMBER_ID];
    return !partNumber || !partNumber.value || partNumber.value.trim() === '';
  });

  if (missingPartNumber.length > 0) {
    missingPartNumber.forEach(item => {
      const link = componentLink(item);
      const category = item.category?.name || 'unknown';
      console.error(`${link} (${category}) is missing Part Number`);
    });

    const linkedNames = missingPartNumber
      .map(componentLink)
      .join(', ');

    return {
      valid: false,
      message: `${missingPartNumber.length} passive components missing Part Number: ${linkedNames}`
    };
  }

  console.info(`All ${passiveComponents.length} passive components have Part Number filled`);
  return {
    valid: true,
    message: 'Part Number validation passed'
  };
}
