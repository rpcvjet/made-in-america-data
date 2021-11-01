const fs = require('fs')
const crypto = require('crypto')
const axios = require('axios');
const dataDir = './_data';
let waiversFile;
let oldData;
let newData;
const DATAURL = "https://portal-test.forms.gov/mia-test/madeinamericanonavailabilitywaiverrequest/submission?created__gt=2021-10-13&select=state,data.requestStatus,data.psc,data.procurementTitle,data.contractingOfficeAgencyName,data.waiverCoverage, data.contractingOfficeAgencyId,data.fundingAgencyId,data.fundingAgencyName,data.procurementStage,data.naics,data.summaryOfProcurement,data.waiverRationaleSummary,data.sourcesSoughtOrRfiIssued,data.expectedMaximumDurationOfTheRequestedWaiver,data.isPricePreferenceIncluded,created,modified,data.ombDetermination,data.conditionsApplicableToConsistencyDetermination,data.solicitationId"
const GITHUBURL = "https://api.github.com/repos/GSA/made-in-america-data/contents/waivers-data.json"
const API_KEY = process.env.GH_API_KEY
const FORMSKEY = process.env.FORMS_API_KEY;

async function loadData() {
  try {
    await smokeCheck();
    await addNewWaivers();
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
    const result = await axios(url, {
      method: 'get',
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
        oldData = JSON.parse(fs.readFileSync(waiversFile, 'utf-8'))
        return;
      })
    } else { 
      oldData = JSON.parse(fs.readFileSync(`${dataDir}/waivers-data.json`, 'utf-8'))
      console.log('Smoke Check completed')
    }
  }
  catch (err) {
    console.error('error in smoke test', err)
  }
}

async function addNewWaivers() {
  //if there is no new data in the directory
  if(!fs.existsSync(`${dataDir}/current-waivers.json`)) {
    //get the data and write it to json
    await getData(DATAURL).then(res => {
      console.log('ADDING NEW WAIVERS!!!!!!')
      fs.writeFileSync(`${dataDir}/current-waivers.json`, JSON.stringify(res.data), 'utf-8', null, 2)
      //and lets call it newData
      newData = JSON.parse(fs.readFileSync(`${dataDir}/current-waivers.json`, 'utf-8'))
      // update our waiver data file
      const diff = newData.filter(n => !oldData?.some(item => n._id === item._id))
      console.log('here2') 
      //compare objects that are not in old and write them into the new file
      fs.writeFileSync(`${newData}`, JSON.stringify(diff), 'utf-8')
      console.log('FINISHED ADDING NEW WAIVERS...')
      console.log('There are ' + newData.length + ' waivers in the current file')
      return;
    })
  }
  // oldData = fs.readFileSync(`${waiversFile}`, 'utf-8', 2)
}


async function pushtoRepo(data) {
   await ajaxMethod(data,'')
}

async function updateRepo(data) {
  console.log('getting SHA Value for Update')
  let response = await getData(GITHUBURL);
  const shaValue = response.data.sha;
  ajaxMethod(data,shaValue)
}

updateReviewedWaivers = () => {
  // //slice out and replace based on modified date
  console.log('Updating Waivers with new modified date')
  let modifiedWaivers = compareJSONsforChangesInModifiedDate(oldData, newData)
  let final = newData.map(obj => modifiedWaivers.find(o => obj._id === o._id) || obj)
  fs.writeFileSync(`${dataDir}/waivers-data.json`, JSON.stringify(final), 'utf-8')
  fs.unlinkSync(`${dataDir}/current-waivers.json`)
}


function compareJSONsforChangesInModifiedDate(prev, current) {
   var result = current.filter(({modified}) =>
    !prev.some(o => new Date(o.modified).getTime() === new Date(modified).getTime())
  );
  return result
}

function ajaxMethod(data, shaValue) {
  let buffered = Buffer.from(JSON.stringify(data)).toString('base64') 
  var jsondata = JSON.stringify({
      "message": "uploading a json file file again",
      "content": buffered,
      "sha" : shaValue
  })

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
        console.log(JSON.stringify(response.data))
        return JSON.stringify(response.data);
      })
      .catch(function (error) {
        if(error.response.status === 409) {
          console.log('409 error!!!!!!!!')
          updateRepo(data);
        } else {
          console.log('error', error)
        }
      });
}

loadData()

   // create new hash
  //  const buffer = crypto.randomBytes(16);

  //  const latest = {
  //    integrity: buffer.toString('hex'),
  //    data: [...oldData, ...diff]
  //  }
