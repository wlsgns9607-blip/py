# builder script
# -*- coding: utf-8 -*-
"""
파일명: 20260930_jinhun.py
설명: 스크린샷의 연락처 관리 프로그램 구조를 그대로 응용하여 만든 계좌 관리 프로그램
작성자: 진훈형님
"""

class Account:
    """계좌 정보를 관리하는 클래스"""
    def __init__(self, account_number, owner, balance):
        self.account_number = account_number
        self.owner = owner
        self.balance = balance

    def print_info(self):
        print('---------------------------')
        print('계좌번호 :', self.account_number)
        print('예금주   :', self.owner)
        print(f'잔액     : {int(self.balance):,}원')
        print('---------------------------')


# 1. 계좌 정보 입력 (연락처 입력 로직 응용)
def set_contact():
    account_number = input('계좌번호 입력: ')
    owner = input('예금주 입력: ')
    balance = input('초기 잔액 입력: ')
    account = Account(account_number, owner, balance)
    return account


# 2. 전체 계좌 출력 (연락처 출력 로직 응용)
def print_contact(contact_list):
    if not contact_list:
        print("\n[알림] 등록된 계좌가 없습니다.")
        return
    for contact in contact_list:
        contact.print_info()


# 3. 계좌 삭제 (이름 또는 계좌번호 기준 삭제 로직 응용)
def delelte_contact(contact_list, name):
    deleted = False
    # 역순으로 순회하여 삭제 시 인덱스 밀림 방지
    for i in range(len(contact_list) - 1, -1, -1):
        if contact_list[i].owner == name or contact_list[i].account_number == name:
            del contact_list[i]
            print(f"'{name}'님의 계좌 정보가 삭제되었습니다.")
            deleted = True
    if not deleted:
        print(f"'{name}'에 해당하는 계좌를 찾을 수 없습니다.")


# 4. 종료 시 db.txt에 파일 저장 (연락처 저장 로직 응용)
def store_contact(contact_list):
    f = open('db.txt', 'wt', encoding='utf-8')
    for contact in contact_list:
        f.write(contact.account_number + '\n')
        f.write(contact.owner + '\n')
        f.write(str(contact.balance) + '\n')
    f.close()
    print("[성공] 계좌 정보가 db.txt에 안전하게 저장되었습니다.")


# 프로그램 실행 시 db.txt 자동 로딩 (연락처 로딩 로직 응용)
def load_contact(contact_list):
    try:
        f = open('db.txt', 'rt', encoding='utf-8')
        lines = f.readlines()
        if not lines:
            f.close()
            return
        
        num = len(lines) / 3  # 계좌당 3줄(계좌번호, 예금주, 잔액)씩 처리
        num = int(num)

        for i in range(num):
            account_number = lines[3 * i].rstrip('\n')
            owner = lines[3 * i + 1].rstrip('\n')
            balance = lines[3 * i + 2].rstrip('\n')
            
            contact = Account(account_number, owner, balance)
            contact_list.append(contact)

        f.close()
        print(f"[알림] db.txt에서 총 {num}개의 계좌 정보를 불러왔습니다.")
    except FileNotFoundError:
        # 파일이 아직 없는 경우 무시하고 진행
        pass


def print_menu():
    print("\n===========================")
    print("      [ 계좌 관리 프로그램 ]")
    print("===========================")
    print('1. 계좌 입력')
    print('2. 계좌 출력')
    print('3. 계좌 삭제')
    print('4. 종료 (db파일 저장)')
    print("---------------------------")
    menu = input('메뉴 선택 : ')
    return int(menu)


def run():
    contact_list = []
    load_contact(contact_list)

    while True:
        menu = print_menu()
        if menu == 1:
            contact = set_contact()
            contact_list.append(contact)
        elif menu == 2:
            print_contact(contact_list)
        elif menu == 3:
            name = input('삭제할 예금주 이름 또는 계좌번호 입력 : ')
            delelte_contact(contact_list, name)
        elif menu == 4:
            store_contact(contact_list)
            print("\n프로그램을 종료합니다. 수고하셨습니다, 진훈형님!")
            break


if __name__ == '__main__':  # 파일 자체 실행 여부 확인
    run()