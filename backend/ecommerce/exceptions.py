from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_response = {
            'success': False,
            'status_code': response.status_code,
            'errors': response.data,
        }
        # Flatten single-key error dicts
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                error_response['message'] = str(response.data['detail'])
                error_response['errors'] = {}
        elif isinstance(response.data, list):
            error_response['message'] = 'Validation error'
        response.data = error_response

    return response
