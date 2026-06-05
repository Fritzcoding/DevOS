from src.app import message


def test_message():
    assert message() == "env-builder python sample ok"
