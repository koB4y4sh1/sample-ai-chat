def test_ag_ui_package_importable() -> None:
    import src

    assert src.__doc__ is not None
    assert callable(src.create_app)
