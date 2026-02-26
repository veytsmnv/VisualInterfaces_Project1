# Documentation
## Motivation and Data
The motivation I had behind this application was for it to provide informative, 
basic statistics about the world as a whole. The data I chose were ones I believed
to be very common statistics that most people would know, but would not know what the
actual numbers are. All of the data was pulled from https://ourworldindata.org/search.

## Design
I did not draw any sketches for this project, but I knew how I wanted to visualize it from
the beginning. I did not want to cram it all onto one page where the user did not have to scroll,
so I put the histograms first, the scatter plot next, and the choropleth at the bottom.

## Visualization
This interface has four charts: two histograms, a scatterplot, and a choropleth. The user
can change the two metrics(sets of data) at the top of the website. Changing the metrics
changes the individual histograms (metric A changes histogram A, etc.), but the scatter plot gets 
changed with both metrics. 
<img width="937" height="313" alt="image" src="https://github.com/user-attachments/assets/6b6f5642-4adf-46f9-a8b4-887c86cfb68a" />
<img width="608" height="224" alt="image" src="https://github.com/user-attachments/assets/9c154127-2c63-40d5-b15a-c4190506575b" />

The choropleth has its own drop-down menu that changes the data it displays. 
<img width="450" height="443" alt="image" src="https://github.com/user-attachments/assets/030327d7-b514-4c53-a171-99579d7964d6" />

## Information
The data sets I chose were life expectancy, GDP per capita, population growth rate, 
CO2 emissions and the under-5 mortality rate. I felt like these statistics all go hand in hand with one another.
A user can compare any of these data sets with one another and find some kind of correlation that connects them, 
educating the user on how one impacts the other. For example, when comparing under-5 mortality and life expectancy, 
the user can see a negative correlation, which indicates that the higher the life expectancy of a country, the lower the 
mortality rate is.
<img width="648" height="230" alt="image" src="https://github.com/user-attachments/assets/37a88633-868f-47a0-8222-1b440d629f0c" />

## Process
This project was built using HTML, CSS, and JavaScript. For all of the charts, I used D3.js. I organized the project in the traditional
JavaScript format. The overall layout is in the index.html file, including the charts and controls(drop-down menus). The style.css file handles 
the grid layout and overall styling of the UI. The main.js file loads and merges all of the datasets and renders the visualizations onto the UI.
I used Promise.all() to load all of the data from the data folder and filtered and unified all of the metrics. The render() function draws the charts 
depending on the data the user selects in the drop-downs. To run locally, the repo needs to be cloned, and a server needs to be started with 
python -m http.server 8000, but the site is hosted publicly at https://visualinterfacesproject1.netlify.app/.

## Future work
I struggled with the last part of this project. I could not figure out how to allow the user to select parts of the data
and display that on the different charts. As I usually do in web development projects, I struggled to deploy the site for a while but eventually
figured it out. I would like to go back and add more story and information about the data because some of the other projects displayed in class looked
really cool and significantly more informative than mine. 

## AI
I used AI as a debugging tool and as a quick reference to functions and basic D3.js information. If I could not find the correct syntax for something online 
I typically asked GPT for help with it.

