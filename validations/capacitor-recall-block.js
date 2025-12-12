exports.validate = async function(data) {
  const { change_order, items } = data;

  // Helper function for component links
  function componentLink(item) {
    const display = item.name || item.eid || item.itemId;
    return `[${display}](item:component/${item.itemId})`;
  }

  // Find all items in the capacitor category
  const capacitorItems = items.filter(item => {
    const categoryName = item.category?.name?.toLowerCase() || '';
    return categoryName.includes('capacitor');
  });

  if (capacitorItems.length > 0) {
    console.error('** SUPPLIER RECALL NOTICE **');
    console.error('Acme Co Resistor Corp has issued a recall on all capacitor products.');
    console.error('No capacitor components may be released until further notice.');
    console.error('');

    capacitorItems.forEach(item => {
      console.error(`${componentLink(item)} - Category: **${item.category?.name}**`);
    });

    const linkedNames = capacitorItems.map(componentLink).join(', ');

    return {
      valid: false,
      message: `BLOCKED: ${capacitorItems.length} capacitor component(s) found. Due to an active recall from Acme Co Resistor Corp, all capacitor parts are frozen and cannot be released. Affected components: ${linkedNames}. Contact Supply Chain for updates on recall status.`
    };
  }

  console.info('No capacitor components found - recall check passed');
  return {
    valid: true,
    message: 'No capacitor components in this change order'
  };
};
