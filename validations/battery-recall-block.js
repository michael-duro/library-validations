exports.validate = async function(data) {
  const { change_order, items } = data;

  // Helper function for component links
  function componentLink(item) {
    const display = item.name || item.eid || item.itemId;
    return `[${display}](item:component/${item.itemId})`;
  }

  // Find all items in the battery category
  const batteryItems = items.filter(item => {
    const categoryName = item.category?.name?.toLowerCase() || '';
    return categoryName.includes('battery');
  });

  if (batteryItems.length > 0) {
    console.error('** SUPPLIER RECALL NOTICE **');
    console.error('Acme Battery Co. has issued a recall on all battery products.');
    console.error('No battery components may be released until further notice.');
    console.error('');

    batteryItems.forEach(item => {
      console.error(`${componentLink(item)} - Category: **${item.category?.name}**`);
    });

    const linkedNames = batteryItems.map(componentLink).join(', ');

    return {
      valid: false,
      message: `BLOCKED: ${batteryItems.length} battery component(s) found. Due to an active recall from Acme Battery Co., all battery parts are frozen and cannot be released. Affected components: ${linkedNames}. Contact Supply Chain for updates on recall status.`
    };
  }

  console.info('No battery components found - recall check passed');
  return {
    valid: true,
    message: 'No battery components in this change order'
  };
};
