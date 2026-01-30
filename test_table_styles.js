// Simple test script to verify table styles generation

// Import the compiled JavaScript version or test directly
const { generateJRXMLContent } = require('./src/utils/jrxmlGenerator.ts');

// Create minimal test data
const testReportProperties = {
  name: 'TestReport',
  pageWidth: 842,
  pageHeight: 595,
  leftMargin: 20,
  rightMargin: 20,
  topMargin: 20,
  bottomMargin: 20
};

const testBands = [
  {
    type: 'detail',
    height: 100,
    elements: [
      {
        type: 'table',
        x: 0,
        y: 0,
        width: 500,
        height: 300,
        uuid: 'test-table-uuid',
        dataset: {
          name: 'testDataset',
          uuid: 'test-dataset-uuid'
        },
        children: [
          {
            uuid: 'col1-uuid',
            name: 'Column1',
            width: 200,
            detailCell: {
              type: 'staticText',
              text: 'Column 1'
            }
          },
          {
            uuid: 'col2-uuid',
            name: 'Column2',
            width: 300,
            detailCell: {
              type: 'staticText',
              text: 'Column 2'
            }
          }
        ]
      }
    ]
  }
];

const testFields = [];
const testParameters = [];
const testDatasets = [];

// Generate JRXML
const generatedJrxml = generateJRXMLContent(
  testReportProperties,
  testBands,
  testFields,
  testParameters,
  testDatasets
);

// Check if table styles are present
const hasTableTHStyle = generatedJrxml.includes('Table_TH');
const hasTableCHStyle = generatedJrxml.includes('Table_CH');
const hasTableTDStyle = generatedJrxml.includes('Table_TD');

console.log('Table styles generation test:');
console.log('- Table_TH style present:', hasTableTHStyle);
console.log('- Table_CH style present:', hasTableCHStyle);
console.log('- Table_TD style present:', hasTableTDStyle);

if (hasTableTHStyle && hasTableCHStyle && hasTableTDStyle) {
  console.log('✅ All table styles generated successfully!');
} else {
  console.log('❌ Some table styles are missing!');
}

// Save the generated JRXML to a file for inspection
const fs = require('fs');
fs.writeFileSync('./test_output.jrxml', generatedJrxml, 'utf8');
console.log('Generated JRXML saved to: test_output.jrxml');
