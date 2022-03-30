module.exports = (error = false)=>{ // doing unit testing for now so there is no use in next() functionality
  if(error){
    throw error;
  } else {
    () =>{};
  }
};