function bit_reverse(num, n) {
    let s = Math.round(Math.log2(n)) - 1;
    let result = num & 1;
    for (num >>= 1; num !== 0; num >>= 1) {
        result <<= 1;
        result |= num & 1;
        --s;
    }
    result <<= s;
    return result;
}

function bit_reverse_order(data) {
    for (let i = 0; i < data.length; ++i) {
        let j = bit_reverse(i, data.length);
        if (j > i) {
            let tmp = data[j];
            data[j] = data[i];
            data[i] = tmp;
        }
    }
    return data;
}

function fft1D(data) {
    bit_reverse_order(data);

    let m = 1;
    for (let s = 1; s <= Math.round(Math.log2(data.length)); ++s) {
        let n = m;
        m *= 2;
        let omega_m_real = Math.cos((2 * Math.PI) / m);
        let omega_m_complex = -Math.sin((2 * Math.PI) / m);

        for (let k = 0; k < data.length; k += m) {
            let omega_real = 1;
            let omega_complex = 0;

            for (let j = 0; j < n; ++j) {
                let t_real = omega_real * data[k + j + m / 2][0] - omega_complex * data[k + j + m / 2][1];
                let t_complex = omega_real * data[k + j + m / 2][1] + omega_complex * data[k + j + m / 2][0];

                let u = [data[k + j][0], data[k + j][1]];

                data[k + j] = [
                    u[0] + t_real,
                    u[1] + t_complex
                ];
                data[k + j + n] = [
                    u[0] - t_real,
                    u[1] - t_complex
                ];

                let omega_real_tmp = omega_real;
                omega_real = omega_real * omega_m_real - omega_complex * omega_m_complex;
                omega_complex = omega_complex * omega_m_real + omega_real_tmp * omega_m_complex;
            }
        }
    }
}

export function fft2D(data) {
    for (let i = 0; i < data.length; ++i) {
        fft1D(data[i]);
    }

    let tmp_row = new Array(data.length);
    for (let i = 0; i < data[0].length; ++i) {
        for (let j = 0; j < data.length; ++j) {
            tmp_row[j] = data[j][i];
        }
        fft1D(tmp_row);
        for (let j = 0; j < data.length; ++j) {
            data[j][i] = tmp_row[j];
        }
    }
}

export function inverse_fft2d(data) {
    for (let i = 0; i < data.length; ++i) {
        let row = data[i];
        for (let j = 0; j < row.length; ++j) {
            let tmp = row[j][0];
            row[j][0] = row[j][1];
            row[j][1] = tmp;
        }
    }

    fft2D(data);

    let scale = data.length * data[0].length;
    for (let i = 0; i < data.length; ++i) {
        let row = data[i];
        for (let j = 0; j < row.length; ++j) {
            let tmp = row[j][0];
            row[j][0] = row[j][1] / scale;
            row[j][1] = tmp / scale;
        }
    }
}

export function convert_to_convex(real_matrix) {
    let result_matrix = new Array(real_matrix.length);
    for (let i = 0; i < real_matrix.length; ++i) {
        result_matrix[i] = new Array(real_matrix[i].length);
        for (let j = 0; j < real_matrix[i].length; ++j) {
            result_matrix[i][j] = [
                real_matrix[i][j],
                0.0
            ];
        }
    }
    return result_matrix;
}