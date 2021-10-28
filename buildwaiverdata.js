const fs = require('fs')
const crypto = require('crypto')
const axios = require('axios');
const dataDir = './_data'
let waiversFile;
let newWaiversFile;
let oldData;
let newData;
const DATAURL = "https://portal-test.forms.gov/mia-test/workingmadeinamericanonavailabilitywaiverrequest/submission?created__gt=2021-10-13&select=state,data.requestStatus,data.psc,data.postSolicitationContainer.procurementTitle,data.contractingOfficeAgencyName,data.contractingOfficeAgencyId,data.fundingAgencyId,data.fundingAgencyName,data.procurementStage,data.naics,data.summaryOfProcurement,data.waiverRationaleSummary,data.sourcesSoughtOrRfiIssued,data.expectedMaximumDurationOfTheRequestedWaiver,data.isPricePreferenceIncluded,created,modified,data.ombDetermination,data.conditionsApplicableToConsistencyDetermination"
const GITHUBURL = "https://api.github.com/repos/GSA/made-in-america-data/contents/waivers-data.json"
const API_KEY = process.env.GH_API_KEY
const FORMSKEY = process.env.FORMS_API_KEY;

async function loadData() {
  try {
    await smokeCheck();
    await addNewWaivers();
    await copyImportedFiles();
    await updateReviewedWaivers();
    await pushtoRepo(oldData)
    console.log('COMPLETED')

  } catch (err) {
    console.log(`${err}`);
  }

}
async function getData(url) {
  try {
    console.log('async data request...')
    const result = axios.get(url, {
      headers: {
        'x-token': FORMSKEY
      }
    })
    return result
  }
  catch (err) {
    console.error(err)
  }
}
async function smokeCheck() {
  try {
    console.log('checking if files exist...')
    if (!fs.existsSync(`${dataDir}/waivers-data.json`)) {
      waiversFile = `${dataDir}/waivers-data.json`
      console.log('file not here')
      fs.writeFileSync(waiversFile, JSON.stringify([]), (err) => {
        if (err) { console.log('err', err) } else {
          console.log('data written to file')
        }
      })
      await getData(DATAURL).then(res => {
        fs.writeFileSync(waiversFile, JSON.stringify(res.data), 'utf-8', null, 2)
        oldData = JSON.parse(fs.readFileSync(`${waiversFile}`, 'utf-8'))
        return;
      })
    }
    oldData = JSON.parse(fs.readFileSync(`${waiversFile}`, 'utf-8'))
    console.log('Smoke Check completed')
  }
  catch (err) {
    console.error('errror in smoke test', err)
  }
}

async function addNewWaivers() {
  console.log('Adding New Waivers...')
  oldData = JSON.parse(fs.readFileSync(`${waiversFile}`, 'utf-8', 2))
  newWaiversFile = `${dataDir}/current-waivers.json`
  await getData(DATAURL).then(res => {
    console.log('ADDING NEW WAIVERS!!!!!!')
    fs.writeFileSync(newWaiversFile, JSON.stringify(res.data), 'utf-8', null, 2)
    newData = JSON.parse(fs.readFileSync(`${newWaiversFile}`, 'utf-8'))
    return;
  })
  const diff = newData.filter(n => !oldData?.some(item => n._id === item._id))
  // build new data
  console.log('FINISHED ADDING NEW WAIVERS...')
  // update our waiver data file
  fs.writeFileSync(`${waiversFile}`, JSON.stringify(diff))
}

copyImportedFiles = () => {
  if (oldData.length === 0) {
    console.log('nothing here so copying files');
    // find unique waivers
    const diff = newData.filter(n => !oldData?.some(item => n._id === item._id))
    // build new data
    console.log('finished building new data...')
    // update our waiver data file
    oldData = fs.writeFileSync(`${waiversFile}`, JSON.stringify(diff))
  } else {

    console.log('There are ' + oldData.length + ' waivers in this file')
    return
  }

}

async function pushtoRepo(data) {
  let response = await getData(GITHUBURL)
  const shaValue = response.data.sha;
  
  let buffered = Buffer.from(JSON.stringify(data)).toString('base64')
  var jsondata = JSON.stringify({
    "message": "uploading a json file file",
    "content": buffered,
    "sha" : shaValue
  });

  var config = {
    method: 'put',
    url: GITHUBURL,
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Content-Type': 'application/json'
    },
    data: jsondata
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });

}

updateReviewedWaivers = () => {
   oldData = JSON.parse(fs.readFileSync(`${waiversFile}`, 'utf-8'))

  // //slice out and replace based on modified date
  console.log('Updating Waivers with new modified date')
  let modifiedWaivers = compareJSONsforChangesInModifiedDate(oldData, newData)
  let final = newData.map(obj => modifiedWaivers.find(o => obj._id === o._id) || obj)
  fs.writeFileSync(`${dataDir}/waivers-data.json`, JSON.stringify(final))
  fs.unlinkSync(`${newWaiversFile}`)
}


function compareJSONsforChangesInModifiedDate(prev, current) {
  console.log('prev', prev)
    // console.log('prev', prev)
   var result = current.filter(({modified}) =>
    !prev.some(o => new Date(o.modified).getTime() === new Date(modified).getTime())
  );
  return result
}

loadData()

   // create new hash
  //  const buffer = crypto.randomBytes(16);

  //  const latest = {
  //    integrity: buffer.toString('hex'),
  //    data: [...oldData, ...diff]
  //  }
