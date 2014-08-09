
/* global d3, ko*/
'use strict';

function initKFModel(N) {
    function invert(Q) {
        // invert 3x3 symmetric matrix (from sympy 'inv.py')
        var q11 = Q[0][0], q12 = Q[0][1], q13 = Q[0][2],
                           q22 = Q[1][1], q23 = Q[1][2],
                                          q33 = Q[2][2];
        var d = 1.0/(q11*q22*q33 - q11*q23*q23 - q12*q12*q33 + 2*q12*q13*q23 - q13*q13*q22);
        var r11 =  q22*q33 - q23*q23 ;
        var r12 =  -q12*q33 + q13*q23 ;
        var r13 =  q12*q23 - q13*q22 ;
        var r22 =  q11*q33 - q13*q13 ;
        var r23 =  -q11*q23 + q12*q13 ;
        var r33 =  q11*q22 - q12*q12 ;

        return [[r11*d,r12*d,r13*d],
                [r12*d,r22*d,r23*d],
                [r13*d,r23*d,r33*d]];
    }
    
    function trans(A) {
        var i, j, B;
        if (!Array.isArray(A[0])) { A = [A]; }
        B = [];
        for (i = 0; i < A[0].length; i++) {
            B.push([]);
            for (j = 0; j < A.length; j++) {
                B[i][j] = A[j][i];
            }
        }
        return B;
    }

    function lincomb(a, A, b, B) {
        var i, j, C;
        if (!Array.isArray(B[0])) { B = [B]; }
        C = [];
        for (i = 0; i < A.length; i++) {
            C.push([]);
            for (j = 0; j < A[0].length; j++) {
                C[i][j] = a * A[i][j] + b * B[i][j];
            }
        }
        return C;
    }

    function matmul(A, B) {
        var i, j, k, C;
        if (!Array.isArray(B[0])) { B = [B]; }
        C = [];
        for (i = 0; i < A.length; i++) {
            C.push([]);
            for (j = 0; j < B[0].length; j++) {
                C[i][j] = 0;
                for (k = 0; k < A.length; k++) {
                    C[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return C;
    }

    function frk(x, y, z, sigma, rho, beta) {

        return [ sigma * (y - x),
                 x * (rho - z) - y,
                 x * y - beta * z ];
    }

    function LorenzValues(x0, s0, x1, s1, x2, s2) {
        var self = this;
        var n = 3;
        x0 = x0 || 0.0;
        s0 = s0 || 5.0;
        x1 = x1 || x0;
        s1 = s1 || s0;
        x2 = x2 || x0;
        s2 = s2 || s0;
        var r0 = d3.random.normal(x0, s0);
        var r1 = d3.random.normal(x1, s1);
        var r2 = d3.random.normal(x2, s2);
        self.x = ko.observable(r0());
        self.y = ko.observable(r1());
        self.z = ko.observable(r2());
        self.time = ko.observable(0);
        self.valString = ko.computed(function () {
            return 'L(' + self.time().toFixed(n) + ') = [' + [self.x().toFixed(n),
            self.y().toFixed(n), self.z().toFixed(n)].join(', ') + ']';
        });
        self.reset = function () {
            self.x(r0());
            self.y(r1());
            self.z(r2());
        };
    }

    function LorenzCov(cov) {
        var self = this;
        var n = 3;
        cov = cov || [[1,0,0],[0,1,0],[0,0,1]];
        this.x = {
            x: ko.observable(cov[0][0]),
            y: ko.observable(cov[0][1]),
            z: ko.observable(cov[0][2])
        };
        this.y = {
            x: this.x.y,
            y: ko.observable(cov[1][1]),
            z: ko.observable(cov[1][2])
        };
        this.z = {
            x: this.x.z,
            y: this.y.z,
            z: ko.observable(cov[2][2])
        };
        this.valString = ko.computed(function () {
            return '[' + [Math.sqrt(self.x.x()).toFixed(n),
                          Math.sqrt(self.y.y()).toFixed(n),
                          Math.sqrt(self.z.z()).toFixed(n)].join(', ') + ']';
        });
    }

    function LorenzModel(val, sigma, rho, beta) {
        sigma = sigma || 10.0;
        rho = rho || 28.0;
        beta = beta || 8.0/3.0;

        this.dtStep = ko.observable(0.01);
        
        this.params = {
            sigma: ko.observable(sigma),
            rho:   ko.observable(rho),
            beta:  ko.observable(beta),
        };
        this.values = val || new LorenzValues();

        this.updateStep = function (dt) {
            if (dt === 0.0) { return; }
            var x = this.values.x(),
                y = this.values.y(),
                z = this.values.z(),
                t = this.values.time(),
                sigma = this.params.sigma(),
                rho = this.params.rho(),
                beta = this.params.beta();
            var a, b, c, d;
             
            a = frk(x, y, z, sigma, rho, beta);
            b = frk(x + dt * a[0]/2, y + dt * a[1]/2, z + dt * a[2]/2, sigma, rho, beta);
            c = frk(x + dt * b[0]/2, y + dt * b[1]/2, z + dt * b[2]/2, sigma, rho, beta);
            d = frk(x + dt * c[0], y + dt * c[1], z + dt * c[2], sigma, rho, beta);

            this.values.x(x + dt * (a[0] + 2*b[0] + 2*c[0] + d[0])/6.0 );
            this.values.y(y + dt * (a[1] + 2*b[1] + 2*c[1] + d[1])/6.0 );
            this.values.z(z + dt * (a[2] + 2*b[2] + 2*c[2] + d[2])/6.0 );
            this.values.time(t + dt);
        };
        this.time = this.values.time;
        this.update = function (dt) {
            var dS = this.dtStep();
            dt = (dt === undefined) ? dS : dt;
            var n = Math.floor(dt/dS);
            var i;
            if (dt < 0) { throw new Error("Negative time step"); }
            for (i = 0; i < n ; i++) {
                this.updateStep(dS);
            }
            this.updateStep(dt - dS * n);
        };
    }
    
    function KFModel(mean, std, sigma, rho, beta, opts) {
        
        var that = this;
        function updateCovStep(dt) {
            if (dt === 0.0) { return; }
            var x = that.mean.x(),
                y = that.mean.y(),
                z = that.mean.z();
            var rho = that.params.rho(),
                sigma = that.params.sigma(),
                beta = that.params.beta();
            var q11 = that.cov.x.x(),
                q12 = that.cov.x.y(),
                q13 = that.cov.x.z(),
                q22 = that.cov.y.y(),
                q23 = that.cov.y.z(),
                q33 = that.cov.z.z();
            var r11, r12, r13, r22, r23, r33;

            // generated from isympy M * Q * M.T
            r11 =  dt*sigma*(dt*q22*sigma - q12*(dt*sigma - 1)) - (dt*sigma - 1)*(dt*q12*sigma - q11*(dt*sigma - 1)) ;
            r12 =  -dt*x*(dt*q23*sigma - q13*(dt*sigma - 1)) + dt*(rho - z)*(dt*q12*sigma - q11*(dt*sigma - 1)) - (dt - 1)*(dt*q22*sigma - q12*(dt*sigma - 1)) ;
            r13 =  dt*x*(dt*q22*sigma - q12*(dt*sigma - 1)) + dt*y*(dt*q12*sigma - q11*(dt*sigma - 1)) - (beta*dt - 1)*(dt*q23*sigma - q13*(dt*sigma - 1)) ;
            r22 =  dt*x*(-dt*q13*(rho - z) + dt*q33*x + q23*(dt - 1)) - dt*(rho - z)*(-dt*q11*(rho - z) + dt*q13*x + q12*(dt - 1)) + (dt - 1)*(-dt*q12*(rho - z) + dt*q23*x + q22*(dt - 1)) ;
            r23 =  -dt*x*(-dt*q12*(rho - z) + dt*q23*x + q22*(dt - 1)) - dt*y*(-dt*q11*(rho - z) + dt*q13*x + q12*(dt - 1)) + (beta*dt - 1)*(-dt*q13*(rho - z) + dt*q33*x + q23*(dt - 1)) ;
            r33 =  dt*x*(dt*q12*y + dt*q22*x - q23*(beta*dt - 1)) + dt*y*(dt*q11*y + dt*q12*x - q13*(beta*dt - 1)) - (beta*dt - 1)*(dt*q13*y + dt*q23*x - q33*(beta*dt - 1)) ;
            
            var nn = Number.MAX_VALUE;
            that.cov.x.x(Math.min(r11, nn));
            that.cov.x.y(r12);
            that.cov.x.z(r13);
            that.cov.y.y(Math.min(r22, nn));
            that.cov.y.z(r23);
            that.cov.z.z(Math.min(r33, nn));
        }

        var cov = [[std[0]*std[0], 0, 0],
                   [0, std[1]*std[1], 0],
                   [0, 0, std[2]*std[2]]];
        var val = new LorenzValues(mean[0], std[0], mean[1], std[1], mean[2], std[2]);
        var mod = new LorenzModel(val, sigma, rho, beta);
        this.value = val;
        this.errStep = ko.observable(0.01); //mod.dtStep;
        this.mean = val;
        this.cov = new LorenzCov(cov);
        cov = this.cov;
        this.params = mod.params;
        this.time = val.time;
        this.update = function (dt) {
            var dS = this.errStep();
            dt = (dt === undefined) ? dS : dt;
            var n = Math.floor(dS/dt);
            var i;
            for (i = 0; i < n; i++) {
                updateCovStep(dS);
                mod.update(dS);
            }
            updateCovStep(dt - dS*n);
            mod.update(dt - dS*n);
        };
        this.assimilate = function (obs, ivar) {
            var mmean = trans([[val.x(), val.y(), val.z()]]);
            var mcov = [[cov.x.x(), cov.x.y(), cov.x.z()],
                        [cov.y.x(), cov.y.y(), cov.y.z()],
                        [cov.z.x(), cov.z.y(), cov.z.z()]];
            var omean = trans(obs.getObs(val.time(),ivar));
            var ocov = obs.getCov(val.time(),ivar);
            var H = obs.getH(ivar);
            var Ht = trans(H);

            var y = lincomb(1,omean,-1,matmul(H, mmean));
            var S = lincomb(1, matmul(matmul(H, mcov),Ht), 1, ocov);

            var K = matmul(matmul(mcov, Ht), invert(S));
            mmean = lincomb(1, mmean, 1, matmul(K, y));
            mcov = matmul(lincomb(1,[[1,0,0],[0,1,0],[0,0,1]],-1,matmul(K,H)),mcov);
            
            if (Number.isFinite(mmean[0][0]) && 
                Number.isFinite(mmean[1][0]) &&
                Number.isFinite(mmean[2][0])) {

            val.x(mmean[0][0]);
            val.y(mmean[1][0]);
            val.z(mmean[2][0]);

            cov.x.x(mcov[0][0]); cov.x.y(mcov[0][1]); cov.x.z(mcov[0][2]);
                                 cov.y.y(mcov[1][1]); cov.y.z(mcov[1][2]);
                                                      cov.x.z(mcov[2][2]);
            return [omean[0][0], omean[1][0], omean[2][0]];
            } else {
                return [10000, 10000, 10000]
            }

        };
    }
    
    function EnKFModel(mean, std, sigma, rho, beta, opts) {
        opts = opts || {};
        var N = opts.N || 10;
        var values = [];
        var models = [];
        var i;
        var that = this;
        for (i = 0; i < N; i++) {
            values.push(new LorenzValues(mean[0], std[0], mean[1], std[1], mean[2], std[2]));
            models.push(new LorenzModel(values[i], sigma, rho, beta));
        }
        function updateMean() {
            that.mean.x(values.reduce(function (s, m) { return s + m.x(); }, 0)/N);
            that.mean.y(values.reduce(function (s, m) { return s + m.y(); }, 0)/N);
            that.mean.z(values.reduce(function (s, m) { return s + m.z(); }, 0)/N);
        }
        function updateCov() {
            var x0 = that.mean.x(), y0 = that.mean.y(), z0 = that.mean.z();
            var cov = [[0,0,0],[0,0,0],[0,0,0]];
            values.forEach(function (v) {
                cov[0][0] += v.x() * v.x();
                cov[0][1] += v.x() * v.y();
                cov[0][2] += v.x() * v.z();
                cov[1][1] += v.y() * v.y();
                cov[1][2] += v.y() * v.z();
                cov[2][2] += v.z() * v.z();
            });
            that.cov.x.x( cov[0][0]/N - x0*x0 );
            that.cov.x.y( cov[0][1]/N - x0*y0 );
            that.cov.x.z( cov[0][2]/N - x0*z0 );
            that.cov.y.y( cov[1][1]/N - y0*y0 );
            that.cov.y.z( cov[1][2]/N - y0*z0 );
            that.cov.z.z( cov[2][2]/N - z0*z0 );
        }
        this.mean = new LorenzValues();
        this.cov = new LorenzCov();
        this.update = function (dt) {
            var i;
            for (i = 0; i < N; i++) {
                models[i].update(dt);
                updateMean();
                updateCov();
            }
        };
        this.params = models[0].params;
        this.time = models[0].time;
        this.ensemble = values;
        this.assimilate = function (obs, ivar) {
            var mmean = that.mean;
            mmean = trans([mmean.x(), mmean.y(), mmean.z()]);
            var cov = that.cov;
            var mcov = [[cov.x.x(), cov.x.y(), cov.x.z()],
                        [cov.y.x(), cov.y.y(), cov.y.z()],
                        [cov.z.x(), cov.z.y(), cov.z.z()]];
            var omean = trans(obs.getObs(that.time(),ivar));
            var ocov = obs.getCov(that.time(),ivar);
            var H = obs.getH(ivar);
            var Ht = trans(H);
            var rnd = [[],[],[]],
                rx = d3.random.normal(omean[0][0], Math.sqrt(ocov[0][0])),
                ry = d3.random.normal(omean[1][0], Math.sqrt(ocov[1][1])),
                rz = d3.random.normal(omean[2][0], Math.sqrt(ocov[2][2]));
            var i;
            var mmeanC = [[],[],[]];
            for (i = 0; i < N; i++) {
                rnd[0].push(rx());
                rnd[1].push(ry());
                rnd[2].push(rz());
                mmeanC[0].push(mmean[0]);
                mmeanC[1].push(mmean[1]);
                mmeanC[2].push(mmean[2]);
            }

            var y = lincomb(1,rnd,-1,mmeanC);
            var S = lincomb(1, matmul(matmul(H, mcov),Ht), 1, ocov);

            var K = matmul(matmul(mcov, Ht), invert(S));
            mmean = lincomb(1, mmeanC, 1, matmul(K, y));
            mcov = matmul(lincomb(1,[[1,0,0],[0,1,0],[0,0,1]],-1,matmul(K,H)),mcov);
            
            if (Number.isFinite(mmean[0][0]) &&
                Number.isFinite(mmean[1][0]) &&
                Number.isFinite(mmean[2][0])) {
                
                for (i = 0; i < N; i++) {
                    values[i].x(mmean[0][i]);
                    values[i].y(mmean[1][i]);
                    values[i].z(mmean[2][i]);
                }

                return [omean[0][0], omean[1][0], omean[2][0]];
            } else {
                console.log(mmeanC[0].join());
                console.log(mmeanC[1].join());
                console.log(mmeanC[2].join());
                return [10000, 10000, 10000];
            }

        };
    }

    function ObsModel(mean, std, sigma, rho, beta, opts) {
        var values = new LorenzValues(mean[0], 0, mean[1], 0, mean[2], 0);
        var model = new LorenzModel(values, sigma, rho, beta);
        var itime = 0;
        var that = this;
        this.err = ko.observable(5);
        this.pause = ko.observable(false);
        this.pauseFunction = function () {
            this.pause(!this.pause());
        };
        this.getObs = function (time, ivar, err) {
            std[0] = that.err();
            std[1] = that.err();
            std[2] = that.err();
            err = (err === undefined ? 1.0 : err);
            if (time < itime) {
                throw new Error('Cannot run model backward in time');
            }
            model.update(time - itime);
            itime = time;
            if (ivar === undefined) {
                return [d3.random.normal(values.x(),std[0]*err)(),
                        d3.random.normal(values.y(),std[1]*err)(),
                        d3.random.normal(values.z(),std[2]*err)()];
            } else if (ivar === 0) {
                return d3.random.normal(values.x(),std[0]*err)();
            } else if (ivar === 1) {
                return d3.random.normal(values.y(),std[1]*err)();
            } else if (ivar === 2) {
                return d3.random.normal(values.z(),std[2]*err)();
            }
        };
        this.getCov = function (time, ivar) {
            var sx = that.err();
            sx = sx * sx;
            var cov = [[sx, 0, 0],
                       [0, sx, 0],
                       [0, 0, sx]];
            if (ivar === undefined) {
                return cov;
            } else {
                return [[cov[ivar][ivar]]];
            }
        };
        this.getH = function (ivar) {
            function val (j) {
                return ( ivar === j ) ? 1 : 0;
            }
            if (ivar === undefined) {
                return [[1,0,0],[0,1,0],[0,0,1]];
            } else {
                return [[val(0), val(1), val(2)]];
            }
        };
    }
    
    var kfmod;
    if (N) {
        kfmod = new EnKFModel([-5,5,10],[0.1,0.1,0.1],null,null,null,{N:N});
    } else {
        kfmod = new KFModel([-5,5,10],[0.1,0.1,0.1],null,null,null,{});
    }
    var obs = new ObsModel([5,-5,12],[5,5,5],null,null,null,{});
    
    kfmod.controls = {
        paused: ko.observable(true)
    };

    return {model: kfmod, obs: obs};
}
