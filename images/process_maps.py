#!/usr/bin/env python3
import os


def rename_map_png_files(scale, x_start, x_end, y_start, y_end):
    map_dir = 'maps' + os.sep + str(scale)
    filenames =  sorted(os.listdir(map_dir))
    for filename in filenames:
        if filename.startswith('.'):
            continue
        foo, bar = filename.split('.')
        s, a, b = foo.split('_')
        print(s, a, b)
        x = int(a)
        y = int(b)
        if x_start <= x <= x_end and y_start <= y <= y_end:
            print(s, x, y)
            os.rename(map_dir + os.sep + filename, "%s/%d_%d.png" % (map_dir, x-x_start, y-y_start))


if __name__ == '__main__':
    #rename_map_png_files(2, 0, 3, 0, 3)
    #rename_map_png_files(3, 1, 6, 1, 6)
    #rename_map_png_files(4, 2, 13, 3, 12)
    #rename_map_png_files(5, 4, 27, 6, 25)
    #rename_map_png_files(6, 8, 55, 12, 51)
    rename_map_png_files(7, 17, 110, 24, 103)


