'use strict';

function kfModel(mod, dt) {
    var v = mod.values;
    var x, y, z, rho, sigma, beta;
    var t2 = dt * dt;

    x = v.x();
    y = v.y();
    z = v.z();
    rho = mod.params.rho();
    sigma = mod.params.sigma();
    beta = mod.params.beta();

    var q11 = v.q11(), q12 = v.q12(), q13 = v.q13();
    var q21 = v.q21(), q22 = v.q22(), q23 = v.q23();
    var q31 = v.q31(), q32 = v.q32(), q33 = v.q33();

/*
    v.q11( sigma * sigma * (q11 - q12 - q21 + q22) );
    v.q12( sigma * (q12 - q22 + x*(q13-q23) - (q11-q21)*(rho-z)) );
    v.q13( sigma * (beta*(q13-q23) - x*(q12-q22) - y*(q11-q21)) );

    v.q21( sigma * ((q12-q11)*(rho-z) + q21 - q22 + (q31-q32)*x) );
    v.q22( (z - rho) * (q21 -q11*(rho-z) + q21 + q31*x) + x * (q32 - q13*(rho-z) + q23 + q33*x) );
    v.q23( );
*/

// generated from isympy M * Q * M.T
    q11=sigma*sigma*(q11 - q12 - q21 + q22);
    q12=sigma*(q12 - q22 + x*(q13 - q23) - (q11 - q21)*(rho - z));
    q13=sigma*(beta*(q13 - q23) - x*(q12 - q22) - y*(q11 - q21));
    q21=sigma*(-q11*(rho - z) + q12*(rho - z) + q21 - q22 + q31*x - q32*x);
    q22=-q12*(rho - z) + q22 + q32*x + x*(-q13*(rho - z) + q23 + q33*x) - (rho - z)*(-q11*(rho - z) + q21 + q31*x);
    q23=beta*(-q13*(rho - z) + q23 + q33*x) - x*(-q12*(rho - z) + q22 + q32*x) - y*(-q11*(rho - z) + q21 + q31*x);
    q31=sigma*(beta*q31 - beta*q32 - q11*y + q12*y - q21*x + q22*x);
    q32=beta*q32 - q12*y - q22*x - x*(-beta*q33 + q13*y + q23*x) + (rho - z)*(-beta*q31 + q11*y + q21*x);
    q33=-beta*(-beta*q33 + q13*y + q23*x) + x*(-beta*q32 + q12*y + q22*x) + y*(-beta*q31 + q11*y + q21*x);

    v.q11(q11*t2);
    v.q12(q12*t2);
    v.q13(q13*t2);
    
    v.q21(q21*t2);
    v.q22(q22*t2);
    v.q23(q23*t2);
    
    v.q31(q31*t2);
    v.q32(q32*t2);
    v.q33(q33*t2);
}

