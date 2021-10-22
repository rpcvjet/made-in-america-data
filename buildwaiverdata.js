const fs = require('fs')
const crypto = require('crypto')
const axios  = require('axios');
const dataDir = './_data'
let waiversFile;
let newWaiversFile;
let oldData;
let newData;
// const newData = JSON.parse(fs.readFileSync(`${newWaiversFile}`, 'utf-8' ,2))
const DATAURL = "https://portal-test.forms.gov/mia-test/workingmadeinamericanonavailabilitywaiverrequest/submission?created__gt=2021-10-13&select=state,data.requestStatus,data.psc,data.postSolicitationContainer.procurementTitle,data.contractingOfficeAgencyName,data.contractingOfficeAgencyId,data.fundingAgencyId,data.fundingAgencyName,data.procurementStage,data.naics,data.summaryOfProcurement,data.waiverRationaleSummary,data.sourcesSoughtOrRfiIssued,data.expectedMaximumDurationOfTheRequestedWaiver,data.isPricePreferenceIncluded,created,modified,data.ombDetermination,data.conditionsApplicableToConsistencyDetermination"
const FORMSKEY = process.env.FORMS_API_KEY;

async function loadData() {
  try {
    await smokeCheck();
    await copyImportedFiles();
    // await addNewWaivers();
    // await updateReviewedWaivers();
    console.log('COMPLETED')
  
  } catch (err) {
      console.log(`${err}`);
  }

}
 async function getData(url){
  try {
    console.log('async data request...')
    const result = axios.get(url, {headers: {
      'x-token': FORMSKEY
    }})
    return result
 }
 catch(err) {
   console.error(err)
 }
}
async function smokeCheck (){  
  try{
    console.log('checking if files exist...')
    if(!fs.existsSync(`${dataDir}/waivers-data.json`)) {
      waiversFile = `${dataDir}/waivers-data.json`
      console.log('file not here')
     fs.writeFileSync(waiversFile, JSON.stringify([]), (err) => {
       if(err) {console.log('err', err) } else {
         console.log('data written to file')
       }
     })
      await getData(DATAURL).then(res => {
       fs.writeFileSync(waiversFile, JSON.stringify(res.data), 'utf-8', null, 2)
        oldData = JSON.parse(fs.readFileSync(`${waiversFile}`, 'utf-8'))
        return;
     })
    } 
    console.log('Smoke Check completed')

  }
  catch(err) {
    console.error('errror in smoke test', err)
  }
}

copyImportedFiles = () => {
  if(oldData?.length === 0) {
    console.log('nothing here so copying files');
    // find unique waivers
    const diff = newData.filter(n => !oldData?.some(item => n._id === item._id)) 
    // build new data
    console.log('finished building new data...')
    // update our waiver data file
   oldData = fs.writeFileSync(`${waiversFile}`, JSON.stringify(diff))
  }  else {

    console.log('There are ' + oldData.length + ' waivers in this file')
    return
  }

}

// updateReviewedWaivers = () => {
//   console.log('Updating Waivers with stats of REVIEWED')
//   let reviewed = newData.filter(item => item.data.requestStatus === "reviewed")
//   let result = newData.map(obj => reviewed.find(o => obj._id === o._id) || obj)
//   fs.writeFileSync(`${waiversFile}`, JSON.stringify(result))
//   fs.unlinkSync(`${newWaiversFile}`)
// }

// addNewWaivers = () => {
//   console.log('Adding New Waivers...')
//   oldData = JSON.parse(fs.readFileSync(`${waiversFile}`, 'utf-8' ,2))
//   console.log('Old data',oldData.length)
//   console.log('New data',newData.length)
//   if(oldData.length === newData.length) {
//     console.log('no new waivers')
//     return
//   }
//   console.log('ADDING NEW WAIVERS!!!!!!')
//   const diff = newData.filter(n => !oldData?.some(item => n._id === item._id)) 
//   // build new data
//   console.log('FINISHED ADDING NEW WAIVERS...')
//   // update our waiver data file
//   fs.writeFileSync(`${waiversFile}`, JSON.stringify(diff))
//   // remove new data file from project

// }

loadData()

   // create new hash
  //  const buffer = crypto.randomBytes(16);
   
  //  const latest = {
  //    integrity: buffer.toString('hex'),
  //    data: [...oldData, ...diff]
  //  }
   