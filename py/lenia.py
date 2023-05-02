import numpy as np
from js import (update_canvas)
from pyodide.ffi import to_js

class LeniaParameters:
    def __init__(self, frequency=1 / 10, R=13, m=0.15, s=0.015):
        self.frequency = frequency
        self.R = R
        self.m = m
        self.s = s


class Lenia:
    def __init__(self, width, height, state=False, parameters=LeniaParameters()):
        self.width = width
        self.height = height
        if not state:
            self.state = np.random.rand(width, height)
        else:
            self.state = state
        self.initial_state = self.state
        self.parameters = parameters
        half_width = width // 2
        half_height = height // 2
        x_arr, y_arr = np.mgrid[0:width, 0:height]
        D = np.sqrt((x_arr - half_width) ** 2 + (y_arr - half_height) ** 2) / parameters.R
        kernel = (D < 1) * Lenia._bell_function(D)
        self.fourier_kernel = np.fft.fft2(np.fft.fftshift(kernel / np.sum(kernel)))

    @staticmethod
    def _bell_function(x, m=0.5, s=0.15):
        return np.exp(-((x - m) / s) ** 2 / 2)

    def needs_update(self) -> bool:
        return True

    def _growth(self, x):
        return Lenia._bell_function(x, self.parameters.m, self.parameters.s) * 2 - 1

    def update(self):
        u = np.real(np.fft.ifft2(self.fourier_kernel * np.fft.fft2(self.state)))
        self.state = np.clip(self.state + self.parameters.frequency * self._growth(u), 0, 1)

    def draw(self, index):
        update_canvas(index, to_js(self.state))


    def display(self, pixels, offset_x, offset_y):
        pixels[offset_x:(offset_x + self.width), offset_y:(offset_y + self.height), 0] = self.state * 255
        pixels[offset_x:(offset_x + self.width), offset_y:(offset_y + self.height), 1] = self.state * 255
        pixels[offset_x:(offset_x + self.width), offset_y:(offset_y + self.height), 2] = self.state * 255

    def set_data(self, data):
        self.state = data
        self.initial_state = self.state

    def reset(self):
        self.state = self.initial_state
