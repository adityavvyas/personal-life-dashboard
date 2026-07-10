const xlsx = require('xlsx'); 
const wb = xlsx.readFile('Monthly_Expense_Tracker.xlsx'); 
wb.SheetNames.forEach(name => { 
  console.log('SHEET:', name); 
  console.log(xlsx.utils.sheet_to_json(wb.Sheets[name]).slice(0, 10)); 
});
