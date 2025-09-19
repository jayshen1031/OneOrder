#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import chardet
import pandas as pd

def detect_encoding(file_path):
    """检测文件编码"""
    with open(file_path, 'rb') as f:
        raw_data = f.read()
        result = chardet.detect(raw_data)
        return result['encoding']

def convert_csv_files():
    """转换CSV文件编码并读取内容"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_files = [f for f in os.listdir(current_dir) if f.endswith('.csv')]
    
    for csv_file in csv_files:
        file_path = os.path.join(current_dir, csv_file)
        print(f"\n=== 处理文件: {csv_file} ===")
        
        # 检测编码
        encoding = detect_encoding(file_path)
        print(f"检测到编码: {encoding}")
        
        try:
            # 尝试多种编码方式读取
            encodings_to_try = [encoding, 'gbk', 'gb2312', 'utf-8', 'latin-1']
            
            for enc in encodings_to_try:
                if enc:
                    try:
                        df = pd.read_csv(file_path, encoding=enc)
                        print(f"成功使用编码 {enc} 读取文件")
                        print(f"文件形状: {df.shape}")
                        print("前5行数据:")
                        print(df.head().to_string())
                        
                        # 保存为UTF-8编码
                        utf8_file = os.path.join(current_dir, f"utf8_{csv_file}")
                        df.to_csv(utf8_file, encoding='utf-8', index=False)
                        print(f"已保存UTF-8版本: utf8_{csv_file}")
                        break
                    except Exception as e:
                        continue
            else:
                print(f"无法读取文件 {csv_file}")
                
        except Exception as e:
            print(f"处理文件 {csv_file} 时出错: {e}")

if __name__ == "__main__":
    convert_csv_files()