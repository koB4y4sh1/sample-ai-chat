def test_ag_ui_package_importable() -> None:
    import ag_ui

    assert ag_ui.__doc__ is not None
