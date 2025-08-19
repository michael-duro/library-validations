exports.validate = async function(data) {
  const { change_order, items } = data;
  
  // Check if there's only one component in the item list
  if (items.length === 1) {
    console.warn(`Change order "${change_order.name}" contains only 1 component`);
    return {
      valid: false,
      message: 'This change order contains only 1 component. Consider whether additional components should be included.'
    };
  }
  
  // Validation passes if there are 0 components (handled elsewhere) or more than 1
  console.info(`Change order contains ${items.length} components`);
  return {
    valid: true,
    message: `Change order contains ${items.length} components`
  };
}