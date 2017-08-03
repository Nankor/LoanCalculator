/**
 * Created by osman on 6/22/2017.
 */

"use strict";

// if there is some stored data, get the data
// and initialize Number validators
window.onload = function () {
    // will need the input ids for storing and validations
    let inputIds = ["loanAmount", "annualInt", "repaymentPeriod", "zipcode"];
    // If the browser supports localStorage and get the stored data
    if (typeof(Storage) !== "undefined") {
        for (let inputId of inputIds) {
            document.getElementById(inputId).value = localStorage.getItem(inputId);
        }
    }
    // initialize Number validators
    initialize(inputIds);
    // Load the Visualization API and the corechart package.
    google.charts.load('current', {'packages': ['corechart']});
};

// input elements if keypress is a number validation
function initialize(inputIds) {
    // function to control if entered char is a number
    function acceptOnlyNumber(event) {
        if (!/\d/.test(String.fromCharCode(event.charCode))) {
            event.preventDefault();
        }
    }

    // add keypress eventhandler for specific input elements
    for (let inputId of inputIds) {
        document.getElementById(inputId).addEventListener('keypress', acceptOnlyNumber);
    }
}


/**
 * This script defines the calculate() function called by the event handlers
 * in HTML above. The function reads values from <input> elements, calculates
 * loan payment information, displays the results in <span> elements. It also
 * saves the user's data, displays links to lenders, and draws a chart.
 */
function calculate() {
    // get the elements
    let loanAmountElem = document.getElementById("loanAmount");
    let annualIntElem = document.getElementById("annualInt");
    let periodInYearsElem = document.getElementById("repaymentPeriod");
    let zipCodeElem = document.getElementById("zipcode");

    // get the values
    let loanAmount = parseInt(loanAmountElem.value);
    let monthlyInterest = parseInt(annualIntElem.value) / (100 * 12);
    let repaymentPeriodInMonths = parseInt(periodInYearsElem.value) * 12;

    // calculate the monthly payment
    let x = Math.pow(1 + monthlyInterest, repaymentPeriodInMonths);
    let monthlyPayment = (loanAmount * x * monthlyInterest) / (x - 1);

    // get display elements
    let monthlyPaymentElem = document.getElementById("monthlyPayment");
    let totalPaymentElem = document.getElementById("totalPayment");
    let totalInterestElem = document.getElementById("totalInterest");

    // if we have a meaningful value show the computed values
    if (isFinite(monthlyPayment)) {
        // show the computed values
        monthlyPaymentElem.textContent = monthlyPayment.toFixed(2);
        totalPaymentElem.textContent = (monthlyPayment * repaymentPeriodInMonths).toFixed(2);
        totalInterestElem.textContent = ((monthlyPayment * repaymentPeriodInMonths) - loanAmount).toFixed(2);

        // try to save the user's data if browser supports it
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem("loanAmount", loanAmountElem.value);
            localStorage.setItem("annualInt", annualIntElem.value);
            localStorage.setItem("repaymentPeriod", periodInYearsElem.value);
            localStorage.setItem("zipcode", zipCodeElem.value);
        }

        // find and display potential lenders
        getLenders(loanAmountElem.value, annualIntElem.value, periodInYearsElem.value, zipCodeElem.value);

        // draw the chart with the calculated info
        chart(loanAmount, monthlyInterest, monthlyPayment, repaymentPeriodInMonths);
    }
    else {
        // if inputs are invalid, clear the display elements
        monthlyPaymentElem.textContent = "";
        totalPaymentElem.textContent = "";
        totalInterestElem.textContent = "";
        document.getElementById('sponsors').innerHTML = "";
        // clear the charts
        chart();
    }
}

// find which object will be used for an Ajax request
function getRequest() {
    let request;
    if (window.XMLHttpRequest) {
        request = new XMLHttpRequest();
    } else {
        request = new ActiveXObject();
    }
    return request;
}

/**
 * Pass the user's input to a server-side script which can (in theory) return
 * a list of links to local lenders interested in making loans. This example
 * does not actually include a working implementation of such a lender-finding
 * service. But if the service existed, this function would work with it.
 */
function getLenders(amount, apr, years, zipcode) {
    // get the Ajax object
    let xhrObject = getRequest();
    // exit if the element is not present
    let sponsorsElem = document.getElementById('sponsors');
    if (!sponsorsElem) return;
    // we dont have a lender-finding server, we just load a json file
    xhrObject.open('GET', 'data.json');
    // set the ajax request callback function
    xhrObject.onreadystatechange = function () {
        if (xhrObject.readyState === 4 && xhrObject.status === 200) {
            let sponsors = JSON.parse(xhrObject.responseText);
            let myHTMLTempalate = '<div class="list-group">';
            for (let sponsor of sponsors) {
                myHTMLTempalate += "<a href='" + sponsor['url'] + "' class='list-group-item'>" + sponsor['name'] + "</a>";
            }
            myHTMLTempalate += '</div>';
            sponsorsElem.innerHTML = myHTMLTempalate;
        }
    };
    // send the ajav request
    xhrObject.send();
}


/**The last optional feature is if you can include the graph in the page:
 * Chart monthly loan balance, interest and equity with google charts
 * If called with no arguments then just erase any previously drawn chart.
 */
function chart(loanAmount, monthlyInterest, monthlyPayment, monthsCount) {
    // if there is no char element just return
    let chartElem = document.getElementById('chart_div');
    if(!chartElem) return;
    // if there are not enough arguments, erase the chart and return
    if (arguments.length !== 4) {
        chartElem.innerHTML = "";
        return;
    }
    // chart labels
    let data = [['Year', 'Total Interest Payments', 'Total Equity', 'Loan Balance']];
    // load the chart data
    let equity, loanBalance;
    for (let i = 0; i <= monthsCount; i++) {
        if (i === 0) {
            equity = 0;
            loanBalance = loanAmount;
        } else {
            equity += (monthlyPayment - ((loanAmount - equity) * monthlyInterest));
            loanBalance -= (monthlyPayment - (loanBalance * monthlyInterest));
        }

        data.push([i, i * monthlyPayment, equity, loanBalance]);
    }
    data = google.visualization.arrayToDataTable(data);
    // chart options
    let options = {
        title: 'Loan Balance, Cumulative Equity, and Interest Payments',
        hAxis: {minValue: 0, title: 'Month', titleTextStyle: {color: '#333'}},
        vAxis: {minValue: 0},
        seriesType: 'area',
        series: {2: {type: 'line'}}
    };
    // draw the chart
    let chart = new google.visualization.ComboChart(chartElem);
    chart.draw(data, options);
}
