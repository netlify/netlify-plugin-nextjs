const { copySync } = require('fs-extra')
const { join } = require('path')
const { TEMPLATES_DIR, FUNCTION_TEMPLATE_PATH } = require('../config')
const getNextDistDir = require('./getNextDistDir')
const getNetlifyFunctionName = require('./getNetlifyFunctionName')
const copyDynamicImportChunks = require('./copyDynamicImportChunks')
const { logItem } = require('./logger')

// Create a Netlify Function for the page with the given file path
const setupNetlifyFunctionForPage = async ({ filePath, functionsPath, isApiPage }) => {
  // Set function name based on file path
  const functionName = getNetlifyFunctionName(filePath, isApiPage)
  const functionDirectory = join(functionsPath, functionName)

  if (isApiPage && functionName.endsWith('-background')) {
    logItem(`👁 Setting up API page ${functionName} as a Netlify background function`)
  }

  // Copy function templates
  const functionTemplateCopyPath = join(functionDirectory, `${functionName}.js`)
  copySync(FUNCTION_TEMPLATE_PATH, functionTemplateCopyPath, {
    overwrite: false,
    errorOnExist: true,
  })

  // Copy function helpers
  const functionHelpers = ['renderNextPage.js', 'createRequestObject.js', 'createResponseObject.js']
  functionHelpers.forEach((helper) => {
    copySync(join(TEMPLATES_DIR, helper), join(functionDirectory, helper), {
      overwrite: false,
      errorOnExist: true,
    })
  })

  // Copy any dynamic import chunks
  await copyDynamicImportChunks(functionDirectory)

  // Copy page
  const nextPageCopyPath = join(functionDirectory, 'nextPage', 'index.js')
  const nextDistDir = await getNextDistDir()
  copySync(join(nextDistDir, 'serverless', filePath), nextPageCopyPath, {
    overwrite: false,
    errorOnExist: true,
  })
}

module.exports = setupNetlifyFunctionForPage
