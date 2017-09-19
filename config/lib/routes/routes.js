const path			= require('path'),
	  fs 			= require('fs'),
	  location		= path.resolve('./modules');


module.exports = (app) => {

    let dirObj = {}

    fs.readdirSync(location)
        .filter((dir) => {

            return fs.statSync(`${location}/${dir}`).isDirectory()

        }).forEach((dir, index) => {

            let fileObj

            if (index == 0) {
                app.get('/', (req, res) => {
                    res.render('index')
                })
            }

            fileObj = require(path.resolve(`./modules/${dir}/routes/routes`))

            app.use(fileObj.base,	fileObj.router)

        });

   //  app.use((err, req, res, next) => {

   //  	let date 		= new Date(),
   //  		year 		= `/${date.getFullYear()+1}/`,
   //  		month 		=  date.toLocaleString("en-us", { month: "short" }),
   //  		d 			=  `${date.getDate()}.log`
   //  	    dirArray 	= ['logs', year, month],
   //  	    tempDir		= '';

   //  	dirArray.forEach((n, i) => {
   //  		tempDir+=dirArray[i]   
   //  		if (!fs.existsSync(tempDir)) {
   //  			fs.mkdirSync(tempDir)
   //  		} 	
   //  	});

   //  	if (!fs.existsSync(`${tempDir}/${d}`)) {
			// fs.writeFileSync(`${tempDir}/${d}`, date)		  		
   //  	}

   //  });     

}



