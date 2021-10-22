const fs = require('fs')
const crypto = require('crypto')
const dataDir = './_data'
const waiversFile = `${dataDir}/waivers-data.json`
const newWaiversFile = `${dataDir}/current-waivers.json`
let oldData;
const newData = JSON.parse(fs.readFileSync(`${newWaiversFile}`, 'utf-8' ,2))

async function loadData() {
  try {
    await smokeCheck();
    await copyImportedFiles();
    await addNewWaivers();
    await updateReviewedWaivers();
    console.log('COMPLETED')
  
  } catch (err) {
      console.log(`${err}`);
  }

}

 smokeCheck = () => {  
   console.log('checking if files exist...')
   if(!fs.existsSync(`${waiversFile}`)) {
     fs.writeFileSync(`${waiversFile}`, JSON.stringify([], null, 2), (err) => {
       if(err) console.log('err', err)
       console.log('data written to file')
     })
     oldData = JSON.parse(fs.readFileSync(`${waiversFile}`, 'utf-8' ,2))
     return;
   } 
   console.log('Smoke Check completed')
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
    console.log('imported files copied')
    return
  }

}

updateReviewedWaivers = () => {
  console.log('Updating Waivers with stats of REVIEWED')
  let reviewed = newData.filter(item => item.data.requestStatus === "reviewed")
  let result = newData.map(obj => reviewed.find(o => obj._id === o._id) || obj)
  fs.writeFileSync(`${waiversFile}`, JSON.stringify(result))
  fs.unlinkSync(`${newWaiversFile}`)
}

addNewWaivers = () => {
  console.log('Adding New Waivers...')
  oldData = JSON.parse(fs.readFileSync(`${waiversFile}`, 'utf-8' ,2))
  console.log('Old data',oldData.length)
  console.log('New data',newData.length)
  if(oldData.length === newData.length) {
    console.log('no new waivers')
    return
  }
  console.log('ADDING NEW WAIVERS!!!!!!')
  const diff = newData.filter(n => !oldData?.some(item => n._id === item._id)) 
  // build new data
  console.log('FINISHED ADDING NEW WAIVERS...')
  // update our waiver data file
  fs.writeFileSync(`${waiversFile}`, JSON.stringify(diff))
  // remove new data file from project

}

loadData()

   // create new hash
  //  const buffer = crypto.randomBytes(16);
   
  //  const latest = {
  //    integrity: buffer.toString('hex'),
  //    data: [...oldData, ...diff]
  //  }
   